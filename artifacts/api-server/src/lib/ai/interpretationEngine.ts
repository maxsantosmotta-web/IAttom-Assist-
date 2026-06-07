/**
 * Motor de Interpretação e Especialistas — BLOCO 1.5
 *
 * Camada interna de refinamento de contexto.
 * Não gera conteúdo — apenas enriquece o contexto antes da IA.
 * Reutilizável em: Criativo, Campanha, Script, Vídeo.
 *
 * Fluxo: Usuário → Interpretação → Especialista → Prompt refinado → IA
 */

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type SpecialistKey = "marketplace" | "social" | "infoproduto" | "perfil" | "generic";

export interface ProductInterpretation {
  productName: string;
  category: string;
  productType: string;
  platform: string;
  objective: string;
}

export interface SpecialistContext {
  key: SpecialistKey;
  name: string;
  visualDirectives: string[];
  compositionGuidance: string;
  conversionFocus: string;
}

export interface RefinedContext {
  specialist: SpecialistKey;
  interpretation: ProductInterpretation;
  systemEnhancement: string;
  userEnhancement: string;
}

// ─── Biblioteca de Especialistas ────────────────────────────────────────────

const SPECIALISTS: Record<SpecialistKey, SpecialistContext> = {
  marketplace: {
    key: "marketplace",
    name: "Especialista Marketplace",
    visualDirectives: [
      "fundo branco ou neutro muito claro — padrão de catálogo profissional",
      "produto centralizado e dominante no enquadramento — ocupa 70 a 80% da composição",
      "bordas nítidas do produto com alto contraste em relação ao fundo",
      "iluminação de estúdio profissional: difusa, suave, sem sombras duras",
      "fotografia de produto em nível de catálogo — sem adereços ou texturas que desviem a atenção",
      "composição focada em conversão — todos os elementos reforçam a intenção de compra",
      "representação fotorrealista do produto — preservar forma exata, cores e proporções",
    ],
    compositionGuidance: "Composição de catálogo marketplace — produto é o único protagonista, limpo e imediatamente identificável em miniatura",
    conversionFocus: "gerar decisão de compra por meio de clareza absoluta do produto, qualidade profissional e confiança visual",
  },

  social: {
    key: "social",
    name: "Especialista Social",
    visualDirectives: [
      "impacto visual imediato — ousado, magnético, prendendo a atenção em menos de 1 segundo",
      "contraste forte ou paleta de cores vibrante para interromper o scroll",
      "contexto lifestyle aspiracional — produto inserido em ambiente desejável e atrativo",
      "qualidade cinematográfica ou editorial — iluminação dramática, profundidade atmosférica",
      "composição dinâmica com tensão ou movimento visual para transmitir energia",
      "estética de marca premium — o produto eleva o status percebido de quem o usa",
      "trilha visual natural pelo enquadramento — guia a atenção de forma intencional",
    ],
    compositionGuidance: "Composição voltada para redes sociais — visualmente magnética nos primeiros 0,5 segundos, marca premium, aspiracional e compartilhável",
    conversionFocus: "gerar engajamento, salvamentos e lembrança de marca por meio de impacto visual imediato e associação lifestyle aspiracional",
  },

  infoproduto: {
    key: "infoproduto",
    name: "Especialista Infoproduto",
    visualDirectives: [
      "tratamento visual de autoridade máxima — transmite domínio, expertise e credibilidade",
      "apresentação premium de produto digital — polido, sofisticado, de alto nível",
      "fundos em gradiente escuro ou tons profundos que sinalizam sofisticação e especialização",
      "forte sensação de valor, qualidade e autoridade profissional",
      "hierarquia visual limpa — ponto focal primário claro com espaço negativo intencional",
      "estética de ambiente corporativo ou estúdio premium",
      "sinais de confiança por meio de execução profissional impecável",
    ],
    compositionGuidance: "Composição de autoridade — posiciona o produto como ativo digital premium, confiável e de alto valor que exige respeito",
    conversionFocus: "estabelecer autoridade inabalável e confiança profunda para maximizar a conversão de produtos digitais",
  },

  perfil: {
    key: "perfil",
    name: "Especialista Perfil",
    visualDirectives: [
      "sujeito centralizado e limpo — rosto, logotipo ou símbolo de marca totalmente visível",
      "contraste forte em relação a qualquer fundo — legível em tamanhos pequenos",
      "iluminação profissional ou alinhada com a marca — sem elementos que desviem a atenção",
      "fundo mínimo e sem poluição visual — atenção total no sujeito",
      "bordas nítidas e foco preciso — otimizado para exibição em recorte circular",
    ],
    compositionGuidance: "Composição otimizada para perfil — instantaneamente reconhecível em qualquer escala, centralizado, limpo e impactante",
    conversionFocus: "estabelecer identidade, reconhecimento e presença de marca em qualquer tamanho de exibição",
  },

  generic: {
    key: "generic",
    name: "Especialista Criativo",
    visualDirectives: [
      "qualidade de fotografia comercial premium",
      "iluminação profissional com profundidade natural",
      "hierarquia visual clara — produto é o protagonista inequívoco",
      "composição limpa e intencional alinhada com as expectativas da plataforma",
    ],
    compositionGuidance: "Composição comercial premium — polida, profissional e adequada à plataforma",
    conversionFocus: "criar imagem atraente e profissional que impulsiona a ação desejada do usuário",
  },
};

// ─── Seleção de Especialista ─────────────────────────────────────────────────

function resolveSpecialist(platform: string): SpecialistContext {
  switch (platform) {
    case "mercado_livre":
    case "shopee":
      return SPECIALISTS.marketplace;

    case "instagram":
    case "facebook":
    case "tiktok":
      return SPECIALISTS.social;

    case "hotmart":
    case "kiwify":
      return SPECIALISTS.infoproduto;

    case "perfil":
      return SPECIALISTS.perfil;

    default:
      return SPECIALISTS.generic;
  }
}

// ─── Motor de Interpretação ──────────────────────────────────────────────────

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string; productType: string }> = [
  { pattern: /scooter|moto[^r]|bicicleta|veículo|veiculo|carro|automóvel|automovel|caminhonete/i, category: "Mobilidade", productType: "produto físico — veículo" },
  { pattern: /tênis|tenis|roupa|camiseta|calça|calca|vestido|moda|sapato|bolsa|acessório|acessorio|jaqueta|camisa/i, category: "Moda e Vestuário", productType: "produto físico — moda" },
  { pattern: /curso|ebook|e-book|treinamento|mentoria|consultoria|aula|workshop|formação|formacao|método|metodo/i, category: "Infoproduto", productType: "produto digital" },
  { pattern: /suplemento|proteína|proteina|vitamina|whey|creatina|saúde|saude|nutri/i, category: "Saúde e Nutrição", productType: "produto físico — saúde" },
  { pattern: /celular|smartphone|notebook|computador|eletrônico|eletronico|gadget|fone|tablet|monitor|teclado/i, category: "Tecnologia", productType: "produto físico — eletrônico" },
  { pattern: /cosmétic|cosmetico|maquiagem|creme|perfume|beleza|shampoo|condicionador|skincare|sérum|serum/i, category: "Beleza e Cosméticos", productType: "produto físico — beleza" },
  { pattern: /alimento|comida|bebida|café|cafe|chocolate|snack|lanche|refeição|refeicao|salgado|doce/i, category: "Alimentos e Bebidas", productType: "produto físico — alimento" },
  { pattern: /móvel|movel|sofá|sofa|mesa|cadeira|decoração|decoracao|casa|cozinha|quarto|sala|luminária|luminaria/i, category: "Casa e Decoração", productType: "produto físico — casa" },
  { pattern: /pet|animal|cachorro|gato|aquário|aquario|ração|racao|coleira/i, category: "Pet", productType: "produto para animais" },
  { pattern: /livro|book|manual|guia|apostila/i, category: "Editorial", productType: "produto físico ou digital — editorial" },
  { pattern: /service|serviço|servico|agência|agencia|consultori/i, category: "Serviços", productType: "serviço profissional" },
];

function interpretProduct(prompt: string, platform: string): ProductInterpretation {
  const lowerPrompt = prompt.toLowerCase();

  let category = "Produto";
  let productType = "produto físico";

  for (const entry of CATEGORY_PATTERNS) {
    if (entry.pattern.test(lowerPrompt)) {
      category = entry.category;
      productType = entry.productType;
      break;
    }
  }

  // Infoprodutos em plataformas de infoproduto fazem override da categorização genérica
  if (["hotmart", "kiwify"].includes(platform) && category === "Produto") {
    category = "Infoproduto";
    productType = "produto digital";
  }

  let objective = "gerar imagem comercial de alta qualidade";
  switch (platform) {
    case "mercado_livre":
    case "shopee":
      objective = "gerar imagem de catálogo profissional para marketplace — foco em conversão e clareza de produto";
      break;
    case "hotmart":
    case "kiwify":
      objective = "gerar capa ou banner de produto digital com autoridade, credibilidade e apelo de conversão";
      break;
    case "instagram":
    case "facebook":
      objective = "gerar criativo de alto impacto visual para rede social — foco em engajamento e parada de scroll";
      break;
    case "tiktok":
      objective = "gerar imagem dinâmica e de alto impacto para o ecossistema TikTok — jovem, bold, aspiracional";
      break;
    case "perfil":
      objective = "gerar imagem de perfil profissional ou identidade de marca";
      break;
  }

  return {
    productName: prompt.trim(),
    category,
    productType,
    platform,
    objective,
  };
}

// ─── Construção do Contexto Refinado ────────────────────────────────────────

/**
 * buildRefinedContext
 *
 * Ponto de entrada principal do Motor de Interpretação.
 * Recebe o prompt e a plataforma, retorna contexto enriquecido
 * pronto para injeção nos prompts da IA.
 *
 * @param prompt   - Produto ou descrição do usuário
 * @param platform - Plataforma selecionada (instagram, mercado_livre, etc.)
 */
export function buildRefinedContext(prompt: string, platform: string): RefinedContext {
  const interpretation = interpretProduct(prompt, platform);
  const specialist = resolveSpecialist(platform);

  const systemEnhancement = [
    `── MOTOR DE INTERPRETAÇÃO ──`,
    `PRODUTO: ${interpretation.productName}`,
    `CATEGORIA: ${interpretation.category}`,
    `TIPO: ${interpretation.productType}`,
    `OBJETIVO: ${interpretation.objective}`,
    ``,
    `── ESPECIALISTA ATIVO: ${specialist.name} ──`,
    `DIRETRIZES VISUAIS OBRIGATÓRIAS:`,
    ...specialist.visualDirectives.map((d) => `• ${d}`),
    ``,
    `COMPOSIÇÃO: ${specialist.compositionGuidance}`,
    `FOCO DE CONVERSÃO: ${specialist.conversionFocus}`,
  ].join("\n");

  const userEnhancement = [
    `Categoria identificada: ${interpretation.category} | Tipo: ${interpretation.productType}`,
    `Objetivo: ${interpretation.objective}`,
  ].join("\n");

  return {
    specialist: specialist.key,
    interpretation,
    systemEnhancement,
    userEnhancement,
  };
}
