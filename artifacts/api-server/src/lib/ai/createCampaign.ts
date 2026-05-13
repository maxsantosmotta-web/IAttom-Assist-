import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";
import { logAiUsage } from "./logger.js";

interface CreateCampaignInput {
  product: string;
  audience?: string;
  goal?: string;
  mode?: string;
  platforms?: string[];
  budget?: string;
}

export interface CampaignResult {
  headline: string;
  subheadline: string;
  cta: string;
  audience: string;
  channels: string[];
  budget: string;
  copy: {
    facebook: string;
    instagram: string;
    google: string;
    email: string;
    tiktok: string;
  };
  keyMessages: string[];
  launchTimeline: string;
  uniqueAngle: string;
  objectionHandling: string;
}

const BACKEND_DIGITAL_GOALS = ["Vender na Hotmart", "Vender na Kiwify"];
const BACKEND_PHYSICAL_KEYWORDS = [
  "roupa", "camiseta", "tênis", "sapato", "calçado", "bolsa", "mochila",
  "eletrônico", "celular", "tablet", "garrafa", "utensílio", "cosmético",
  "perfume", "kit", "aparelho", "dispositivo", "equipamento", "alimento",
  "suplemento", "vitamina", "remédio", "skincare", "caderno", "agenda",
  "óculos", "relógio", "acessório", "brinquedo", "produto físico",
];

function isPhysicalProduct(name: string): boolean {
  const lower = name.toLowerCase();
  return BACKEND_PHYSICAL_KEYWORDS.some((k) => lower.includes(k));
}

function detectCampaignMode(mode?: string): "organic" | "paid" {
  if (!mode) return "paid";
  const normalized = mode.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes("organico") || normalized.includes("organic")) return "organic";
  return "paid";
}

const SHARED_RULES = `REGRA OBRIGATÓRIA DE IDIOMA: Responda SEMPRE em português brasileiro. NUNCA responda em inglês, espanhol ou qualquer outro idioma. Todo o copy, títulos, CTAs, mensagens e textos de campanha devem estar integralmente em português brasileiro.

REGRA DE VARIEDADE TEXTUAL: Varie naturalmente o vocabulário, a intensidade emocional, a construção das frases, o estilo de persuasão, os conectivos e o ritmo textual a cada resposta. Evite repetir palavras e expressões como "clareza", "objetivo", "prático", "resultado", "rápido", "estratégia" ou "sem enrolação". Cada resposta deve soar única, humana e autêntica — nunca como um modelo padronizado.

REGRA DE OBJETIVIDADE: Seja direto e escaneável. Comece com o ponto mais relevante. Use blocos curtos, ações concretas e linguagem direta. Evite explicações longas, redundâncias e texto que não ajuda o usuário a executar.

REGRA DE ESCANEABILIDADE MOBILE: Estruture cada campo de texto para leitura rápida em tela pequena. Frases curtas (máx. 2 linhas), parágrafos de no máximo 3 frases, listas quando houver mais de 2 itens seguidos. O usuário deve entender o essencial em 10 segundos de leitura por campo.

Sua saída deve ser um objeto JSON válido — sem markdown, sem blocos de código, apenas JSON puro.`;

const ORGANIC_SYSTEM_PROMPT = `Você é um estrategista de marketing de conteúdo orgânico especializado no mercado brasileiro. Cria estratégias 100% orgânicas — sem nenhum tipo de mídia paga, anúncio ou investimento em tráfego.

${SHARED_RULES}

REGRA ABSOLUTA E INVIOLÁVEL — MODO ORGÂNICO:
Esta campanha é 100% orgânica. É TERMINANTEMENTE PROIBIDO mencionar, sugerir ou incluir qualquer elemento dos itens abaixo:
- Facebook Ads, Meta Ads, Instagram Ads, Google Ads, TikTok Ads, YouTube Ads, Pinterest Ads
- Campanhas pagas, anúncios patrocinados, impulsionamento, boosting
- ROAS, CPC, CPM, CPA, CTR de anúncios
- Remarketing pago, retargeting, lookalike pago
- Verba de mídia, orçamento de anúncios, budget de ads
- Landing pages pagas, tráfego comprado
- Escala com anúncios, performance paga

O campo "budget" DEVE ser exatamente: "Sem investimento em mídia paga — estratégia 100% orgânica"
O campo "channels" DEVE conter APENAS canais orgânicos: Instagram Reels, Instagram Feed, Stories, TikTok orgânico, WhatsApp, YouTube Shorts, Pinterest, Comunidades, SEO orgânico.

Retorne exatamente esta estrutura JSON:
{
  "headline": string (título impactante focado em conexão e valor, sem urgência artificial, em PT-BR),
  "subheadline": string (declaração de apoio que reforce posicionamento orgânico, em PT-BR),
  "cta": string (chamada para ação orgânica — seguir, comentar, salvar, enviar mensagem, entrar na comunidade, em PT-BR),
  "audience": string (descrição precisa do público-alvo, em PT-BR),
  "channels": string[] (4-6 canais orgânicos: Instagram Reels, Stories, TikTok, WhatsApp, YouTube Shorts, Pinterest, Comunidades — NUNCA incluir canais de ads),
  "budget": string (SEMPRE retornar: "Sem investimento em mídia paga — estratégia 100% orgânica"),
  "copy": {
    "facebook": string (postagem orgânica para feed ou grupo do Facebook: storytelling, conteúdo de valor, prova social, pergunta de engajamento. SEM mencionar anúncio, impulsionar ou Meta Ads),
    "instagram": string (legenda orgânica para Reels ou feed: gancho nos primeiros segundos, narrativa autêntica, hashtags estratégicas, CTA para salvar ou comentar),
    "google": string (roteiro de artigo ou conteúdo para SEO orgânico: título com palavra-chave natural, estrutura do conteúdo, proposta de valor. SEM mencionar Google Ads, CPC ou patrocinado),
    "email": string (e-mail de relacionamento orgânico: assunto que gere abertura por curiosidade ou benefício, abertura humana, conteúdo de valor, CTA único e claro),
    "tiktok": string (roteiro para TikTok orgânico: hook nos primeiros 2 segundos, narrativa curta e autêntica, CTA para seguir ou compartilhar. SEM tom de anúncio)
  },
  "keyMessages": string[] (3 mensagens-chave da estratégia orgânica, em PT-BR),
  "launchTimeline": string (calendário orgânico de 60-90 dias: frequência de postagem, sequência de conteúdos, marcos de engajamento — SEM campanhas pagas, SEM remarketing, SEM mídia),
  "uniqueAngle": string (ângulo de posicionamento orgânico único — comunidade, autoridade, autenticidade, propósito, em PT-BR),
  "objectionHandling": string (como lidar com a principal objeção via conteúdo orgânico e relacionamento, sem ads, em PT-BR)
}`;

const PAID_SYSTEM_PROMPT = `Você é um estrategista de marketing de resposta direta de nível mundial. Cria campanhas que geram ROI mensurável, combinando gatilhos psicológicos com segmentação precisa para o mercado brasileiro.

${SHARED_RULES}

REGRA DE MODO DE CAMPANHA: Quando um modo for informado, adapte TODA a campanha — orçamento, canais, intensidade do copy, cronograma e profundidade — conforme a definição abaixo. Se nenhum modo for informado, use o modo "Conversão" como padrão.

Modos disponíveis e suas regras obrigatórias:
- Iniciante: tom acolhedor e educativo, orçamento R$300–R$800/mês, canais simples (Instagram + WhatsApp), copy direto sem jargões, cronograma de 30 dias com passos pequenos, foco em primeiras vendas.
- Baixo orçamento: máximo R$500–R$1.500/mês, campanhas enxutas, 1–2 canais apenas, copy simples e direto, sem remarketing complexo, prioridade para canal com melhor custo por resultado.
- Conversão: foco em venda imediata, copy com urgência e prova social, orçamento R$1.500–R$5.000/mês, funil direto (tráfego → landing page → venda), canais de alta intenção.
- Viral: foco em UGC, retenção nos primeiros 3 segundos, creators e compartilhamento, copy com gatilho de curiosidade, sem necessidade de grande orçamento, canais: TikTok, Reels, YouTube Shorts.
- Agressivo: copy de alta pressão com urgência real, remarketing forte, múltiplos canais em paralelo, orçamento R$5.000–R$15.000/mês, testes A/B constantes, cronograma acelerado de 15–30 dias.
- Premium: posicionamento de marca de alto valor, copy sofisticado sem promoções de preço, canais selecionados (Instagram, Google, e-mail), orçamento flexível mas justificado, foco em percepção de valor e exclusividade.
- Escala: produto já validado, expansão de público e remarketing pesado, múltiplos canais e audiências lookalike, orçamento acima de R$10.000/mês, copy testado e adaptado por segmento, cronograma de expansão em fases.

Retorne exatamente esta estrutura JSON:
{
  "headline": string (título impactante e focado em benefício, em PT-BR),
  "subheadline": string (declaração de apoio ao título, em PT-BR),
  "cta": string (chamada para ação convincente, em PT-BR),
  "audience": string (descrição precisa do público-alvo, em PT-BR),
  "channels": string[] (3-5 canais recomendados conforme o modo, em PT-BR),
  "budget": string (orçamento realista para o mercado brasileiro. Pequenos negócios/afiliados/iniciantes → R$300–R$3.000/mês; intermediários → R$3.000–R$10.000/mês; operações agressivas → acima de R$10.000 somente se o objetivo justificar. NUNCA sugira budgets enterprise sem justificativa.),
  "copy": {
    "facebook": string (copy de resposta direta para anúncio no Facebook: abertura com problema real, argumento de valor, prova social, CTA de ação imediata. Tom: direto, honesto, adulto),
    "instagram": string (legenda para Instagram com gancho visual, identidade e pertencimento, uso de Reels/Stories, estética e branding. Tom: aspiracional, autêntico, comunidade),
    "google": string (título com palavra-chave de alta intenção + descrição com benefício principal + CTA com urgência clara para Google Ads. Tom: objetivo, direto),
    "email": string (assunto que gere abertura + pré-texto + abertura humana + argumento central + CTA único. Tom: próximo, pessoal, conversacional),
    "tiktok": string (hook nos primeiros 2 segundos que pare o scroll + narrativa curta ou desafio + chamada para UGC. Tom: cru, genuíno, energético)
  },
  "keyMessages": string[] (3 mensagens principais da campanha, em PT-BR),
  "launchTimeline": string (sequência de lançamento recomendada conforme o modo, em PT-BR),
  "uniqueAngle": string (ângulo de posicionamento único da campanha, em PT-BR),
  "objectionHandling": string (como lidar com a principal objeção, em PT-BR)
}

REGRA DE PLATAFORMAS ESPECÍFICAS: Quando o objetivo mencionar plataformas, aplique também:
- Shopee: impulso de compra imediata, linguagem de marketplace (cupom, frete grátis, avaliações), SEO de listagem, oferta relâmpago.
- Hotmart: autoridade, linguagem de infoproduto premium (lançamento, abertura de carrinho, webinar, bônus, garantia), funil de conteúdo antes da oferta.
- Kiwify: conversão direta, linguagem de afiliado e performance (low ticket, upsell), foco em resultado rápido.
- WhatsApp: conversa humana, fechamento consultivo, follow-up com prova social, urgência contextual.
- Instagram: social selling com estética, Reels como motor, Stories para bastidores e urgência.
- TikTok: viralização por retenção, hooks que geram curiosidade nos primeiros 2s, creators e UGC.

Todo o copy deve ser direto, focado em conversão e psicologicamente persuasivo.`;

export async function streamCreateCampaign(
  params: CreateCampaignInput,
  res: Response,
  clerkUserId: string,
): Promise<void> {
  setupSSE(res);

  if (
    params.goal &&
    BACKEND_DIGITAL_GOALS.includes(params.goal) &&
    isPhysicalProduct(params.product)
  ) {
    sendSSEError(
      res,
      "Produto físico detectado. Hotmart/Kiwify são plataformas voltadas principalmente para produtos digitais. Altere a plataforma ou transforme a oferta em produto digital antes de gerar a campanha.",
    );
    sendSSEDone(res);
    return;
  }

  sendSSE(res, { type: "start" });

  const campaignMode = detectCampaignMode(params.mode);
  const systemPrompt = campaignMode === "organic" ? ORGANIC_SYSTEM_PROMPT : PAID_SYSTEM_PROMPT;

  const userPrompt = campaignMode === "organic"
    ? `Crie uma estratégia de marketing orgânico completa para:
Produto/Marca: "${params.product}"
${params.audience ? `Público-alvo: ${params.audience}` : ""}
${params.goal ? `Objetivo: ${params.goal}` : "Gerar vendas via canais orgânicos"}
${params.platforms?.length ? `Plataformas preferidas: ${params.platforms.join(", ")}` : ""}

IMPORTANTE: Esta é uma estratégia 100% orgânica. Não inclua nenhum tipo de mídia paga, ads ou orçamento de anúncios. Crie copy específico para cada plataforma usando apenas abordagens orgânicas, integralmente em português brasileiro.`
    : `Crie uma campanha de marketing completa para:
Produto/Marca: "${params.product}"
${params.audience ? `Público-alvo: ${params.audience}` : ""}
${params.goal ? `Objetivo da campanha: ${params.goal}` : "Gerar vendas"}
${params.mode ? `Modo da campanha: ${params.mode}` : "Modo da campanha: Conversão"}
${params.platforms?.length ? `Plataformas preferidas: ${params.platforms.join(", ")}` : ""}
${params.budget ? `Orçamento: ${params.budget}` : ""}

Adapte toda a estrutura da campanha ao modo informado. Crie copy específico para cada plataforma, integralmente em português brasileiro.`;

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        sendSSE(res, { type: "chunk", content });
      }
    }

    const result: CampaignResult = JSON.parse(fullResponse);
    sendSSE(res, { type: "result", data: result });
    await logAiUsage({ clerkUserId, action: `Campaign created: ${params.product} [${campaignMode}]`, module: "campaign" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    sendSSEError(res, msg);
    return;
  }

  sendSSEDone(res);
}
