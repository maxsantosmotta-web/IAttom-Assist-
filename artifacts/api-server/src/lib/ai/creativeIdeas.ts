import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";
import { logAiUsage } from "./logger.js";
import { logger } from "../logger.js";

interface CreativeIdeasInput {
  prompt: string;
  style?: string;
  product?: string;
  targetAudience?: string;
  formatPack?: string;
  platform?: string;
}

export interface CreativeConcept {
  id: number;
  label: string;
  format: string;
  copyHook: string;
  cta: string;
  imagePrompt: string;
  imageBase64?: string;
}

export interface CreativeIdeasResult {
  concepts: CreativeConcept[];
  visualAnchor?: string;
}

type ImageSize = "1024x1024" | "1536x1024" | "1024x1536" | "auto";

function mapFormatToSize(format: string): ImageSize {
  const f = format.toLowerCase();
  if (f.includes("9:16") || f.includes("story") || f.includes("reels") || f.includes("1536")) {
    return "1024x1536";
  }
  if (f.includes("16:9") || f.includes("banner") || f.includes("landscape") || f.includes("1536x1024")) {
    return "1536x1024";
  }
  return "1024x1024";
}

const FORMAT_PACKS: Record<string, string[]> = {
  social:  ["1:1 quadrado", "1:1 quadrado", "9:16 story", "16:9 banner"],
  stories: ["9:16 story",   "9:16 story",   "9:16 story", "9:16 story"],
  ads:     ["16:9 banner",  "16:9 banner",  "1:1 quadrado", "1:1 quadrado"],
};

const PLATFORM_IMAGE_PRESETS: Record<string, string[]> = {
  mercado_livre: ["1:1 quadrado", "1:1 quadrado variação"],
  shopee:        ["1:1 quadrado", "16:9 banner"],
  instagram:     ["1:1 feed", "9:16 story"],
  facebook:      ["1:1 feed", "16:9 banner"],
  tiktok:        ["9:16 vertical", "9:16 vertical variação"],
  hotmart:       ["1:1 thumb/feed", "16:9 banner"],
  kiwify:        ["1:1 thumb/feed", "1:1 thumb/feed variação"],
  whatsapp:      ["1:1 feed", "9:16 status"],
};

function getFormatPack(formatPack?: string, platform?: string): string[] {
  if (platform && PLATFORM_IMAGE_PRESETS[platform]) return PLATFORM_IMAGE_PRESETS[platform];
  if (formatPack && FORMAT_PACKS[formatPack]) return FORMAT_PACKS[formatPack];
  return FORMAT_PACKS.social;
}

function enrichImagePrompt(basePrompt: string, productName: string, visualAnchor: string, style?: string, format?: string): string {
  const anchorPrefix = visualAnchor ? `CAMPAIGN VISUAL ANCHOR — apply consistently across all images: ${visualAnchor}. ` : "";
  const productAnchor = `${productName} — exact product as specified by user, preserve real product appearance, proportions and category`;
  const styleSuffix = style ? ` Visual style: ${style}.` : "";
  const formatSuffix = format ? ` Ad format: ${format}.` : "";
  return `${anchorPrefix}${productAnchor}. ${basePrompt}${styleSuffix}${formatSuffix}`;
}

export async function streamCreativeIdeas(
  params: CreativeIdeasInput,
  res: Response,
  clerkUserId: string,
  signal?: AbortSignal,
): Promise<void> {
  setupSSE(res);
  sendSSE(res, { type: "start" });

  const productName = params.product?.trim() || params.prompt.trim();
  if (process.env.NODE_ENV !== "production") {
    logger.info({ productName }, "[creativeIdeas] productName resolved");
  }

  const formats = getFormatPack(params.formatPack, params.platform);
  const numConcepts = formats.length;
  const formatInstruction = `Os ${numConcepts} conceitos devem usar exatamente estes formatos, nesta ordem: ${formats.map((f, i) => `conceito ${i + 1}: "${f}"`).join(", ")}.`;

  const systemPrompt = `Você é um diretor criativo de nível mundial para publicidade digital. Gera imagens e textos visuais prontos para publicação.

REGRA ABSOLUTA DE FIDELIDADE AO PRODUTO: O produto informado pelo usuário é a referência central e obrigatória. NÃO substitua por categoria genérica, versão aproximada ou produto parecido. Se houver modelo, código, nome comercial ou nome específico, mantenha esse exato nome. Prioridade: fidelidade ao produto > estilo visual > criatividade.

REGRA OBRIGATÓRIA DE IDIOMA: copyHook e cta SEMPRE em português brasileiro. imagePrompt SEMPRE em inglês.

REGRA DE FORMATOS OBRIGATÓRIA: O campo "format" de cada conceito deve conter EXATAMENTE um destes valores:
- "1:1 quadrado"
- "9:16 story"
- "16:9 banner"
Nunca use outros valores.

Sua saída deve ser um objeto JSON válido — sem markdown, sem blocos de código, apenas JSON puro.

Retorne exatamente esta estrutura:
{
  "concepts": [
    {
      "id": number (1-${numConcepts}),
      "label": string (nome curto do criativo em PT-BR, ex: "Feed Principal", "Story", "Banner"),
      "format": string (OBRIGATÓRIO: usar exatamente "1:1 quadrado", "9:16 story" ou "16:9 banner"),
      "copyHook": string (headline/gancho de atenção, máx. 80 chars, em PT-BR),
      "cta": string (texto de chamada para ação, máx. 40 chars, em PT-BR),
      "imagePrompt": string (prompt detalhado para geração de imagem IA — SEMPRE em inglês. REGRA CRÍTICA: Preserve características físicas reconhecíveis do produto: formato, proporção, cor típica, componentes principais. Use o nome exato do produto. OBRIGATÓRIO para qualidade premium: photorealistic, commercial photography quality, cinematic lighting with soft shadows and highlights, clear visual hierarchy, modern and clean composition, professional depth of field, premium advertising aesthetic, product centered and well-composed, high-end magazine quality, clean background or contextual lifestyle setting, natural human anatomy if people appear, no extra fingers, no deformities, no text overlays, no logos, no watermarks, ready-to-publish ad quality, aspirational mood)
    }
  ],
  "visualAnchor": string (âncora visual interna — em inglês: produto exato + paleta dominante 2-3 cores hex + estilo visual + iluminação. Ex: "HydroElite bottle, dominant colors #1a1a2e and #C9A84C gold, photorealistic lifestyle style, soft cinematic side lighting")
}

REGRA DE PACOTE VISUAL COESO:
As ${numConcepts} imagens devem pertencer à MESMA CAMPANHA VISUAL. Defina a âncora visual no campo "visualAnchor" com produto exato + paleta + estilo + iluminação. Todos os imagePrompts devem começar referenciando essa âncora. Variações permitidas: ângulo, enquadramento, cenário. Variações proibidas: categoria do produto, paleta dominante, estilo visual, iluminação central.

Crie ${numConcepts} conceitos criativos distintos prontos para publicação imediata.`;

  const userPrompt = `PRODUTO CENTRAL (referência obrigatória): "${productName}"

Gere ${numConcepts} criativos visuais premium para este produto.
Briefing: "${params.prompt}"
${params.style ? `Estilo visual: ${params.style}` : ""}
${params.targetAudience ? `Público-alvo: ${params.targetAudience}` : ""}

${formatInstruction}

INSTRUÇÃO OBRIGATÓRIA PARA imagePrompt: Inicie SEMPRE com o nome exato "${productName}". Descreva as características físicas prováveis deste produto. O nome "${productName}" deve aparecer na primeira frase do imagePrompt.

Responda copyHook e cta integralmente em português brasileiro.`;

  function safeParseCreativeJson(raw: string): { success: true; data: CreativeIdeasResult } | { success: false; error: string } {
    if (!raw?.trim()) return { success: false, error: "A IA retornou uma resposta vazia." };
    try { return { success: true, data: JSON.parse(raw.trim()) as CreativeIdeasResult }; } catch { /* try next */ }
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    try { return { success: true, data: JSON.parse(cleaned) as CreativeIdeasResult }; } catch { /* try next */ }
    const cs = cleaned.indexOf("{"); const ce = cleaned.lastIndexOf("}");
    if (cs !== -1 && ce !== -1 && ce > cs) {
      try { return { success: true, data: JSON.parse(cleaned.slice(cs, ce + 1)) as CreativeIdeasResult }; } catch { /* try next */ }
    }
    const rs = raw.indexOf("{"); const re = raw.lastIndexOf("}");
    if (rs !== -1 && re !== -1 && re > rs) {
      try { return { success: true, data: JSON.parse(raw.slice(rs, re + 1)) as CreativeIdeasResult }; } catch { /* try next */ }
    }
    return { success: false, error: "A resposta da IA veio incompleta. Seus créditos serão devolvidos automaticamente." };
  }

  try {
    let textResult: CreativeIdeasResult | null = null;
    let lastTextError = "";

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5-mini",
          max_completion_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          stream: false,
        }, { signal });
        const raw = response.choices[0]?.message?.content ?? "";
        const parsed = safeParseCreativeJson(raw);
        if (parsed.success) {
          textResult = parsed.data;
          break;
        }
        lastTextError = parsed.error;
      } catch (err) {
        lastTextError = err instanceof Error ? err.message : "Erro interno na geração de conceitos";
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 900));
    }

    if (!textResult) {
      sendSSEError(res, `${lastTextError} Tente novamente em instantes.`);
      return;
    }

    const visualAnchor = textResult.visualAnchor?.trim() ?? "";

    const enrichedConcepts = textResult.concepts.map((concept) => ({
      ...concept,
      imagePrompt: enrichImagePrompt(concept.imagePrompt, productName, visualAnchor, params.style, concept.format),
    }));

    if (process.env.NODE_ENV !== "production") {
      enrichedConcepts.forEach((c, i) => {
        logger.info({ index: i, imagePrompt: c.imagePrompt.slice(0, 300) }, "[creativeIdeas] enriched imagePrompt");
      });
    }

    const imageResults = await Promise.allSettled(
      enrichedConcepts.map((concept) =>
        generateImageBuffer(concept.imagePrompt, mapFormatToSize(concept.format), signal),
      ),
    );

    const hasAtLeastOneImage = imageResults.some((r) => r.status === "fulfilled");

    if (!hasAtLeastOneImage) {
      sendSSEError(res, "Não foi possível gerar as imagens desta vez. Seus créditos serão devolvidos automaticamente. Tente novamente.");
      return;
    }

    const conceptsWithImages = enrichedConcepts.map((concept, i) => {
      const imgResult = imageResults[i];
      return {
        ...concept,
        imageBase64:
          imgResult.status === "fulfilled"
            ? imgResult.value.toString("base64")
            : undefined,
      };
    });

    const finalResult: CreativeIdeasResult = {
      ...textResult,
      concepts: conceptsWithImages,
    };

    sendSSE(res, { type: "result", data: finalResult });
    await logAiUsage({ clerkUserId, action: `Criativos gerados: ${params.prompt.slice(0, 50)}`, module: "creative" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado na geração. Seus créditos serão devolvidos automaticamente.";
    sendSSEError(res, msg);
    return;
  }

  sendSSEDone(res);
}
