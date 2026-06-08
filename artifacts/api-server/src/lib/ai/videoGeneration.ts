/**
 * Pipeline de Geração de Vídeo — BLOCO 2B
 *
 * Hierarquia obrigatória (imutável):
 *   Prompt do Usuário → Motor de Interpretação → Roteiro Interno → Vídeo Final
 *
 * O prompt do usuário é a fonte principal e nunca pode ser substituído.
 * O Motor de Interpretação organiza, estrutura e refina — nunca transforma o assunto central.
 *
 * Se HEYGEN_CONFIGURED = false → opera em modo mock (sem consumir créditos HeyGen).
 */

import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";
import { logAiUsage } from "./logger.js";
import { logger } from "../logger.js";
import { buildRefinedContext } from "./interpretationEngine.js";
import {
  HEYGEN_CONFIGURED,
  AVATAR_IDS,
  VOICE_IDS,
  generateVideo,
  pollUntilDone,
} from "../heygenClient.js";

// ─── Input / Output ──────────────────────────────────────────────────────────

export interface VideoGenerationInput {
  videoEstilo: "executivo" | "consultor" | "criador";
  videoAvatar: "masculino" | "feminino";
  videoAmbiente: string;
  videoFormato: "9:16" | "1:1" | "16:9";
  videoDuration: 20 | 40 | 60;
  videoPrompt: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  durationSeconds: number;
  videoEstilo: "executivo" | "consultor" | "criador";
  videoAvatar: "masculino" | "feminino";
  videoAmbiente: string;
  videoFormato: "9:16" | "1:1" | "16:9";
  prompt: string;
  generatedAt: string;
  isMock: boolean;
}

// ─── Backgrounds por ambiente ────────────────────────────────────────────────
// Hex color sólida por ambiente. Futura evolução: URLs de imagem reais.

const SCENE_BACKGROUNDS: Record<string, string> = {
  corporativo:  "#1c2333",
  casa:         "#1f1a1f",
  loja:         "#2a1f1a",
  shopping:     "#1a1f2a",
  restaurante:  "#2a1a0f",
  rua:          "#0f1f0f",
  praia:        "#0f1a2a",
  parque:       "#0f2010",
  veiculo:      "#1a1a1a",
  consultorio:  "#1a2020",
  estudio:      "#111111",
};

const FORMATO_TO_ASPECT: Record<string, string> = {
  "9:16": "9:16",
  "1:1":  "1:1",
  "16:9": "16:9",
};

function resolveBackground(ambiente: string): string {
  return SCENE_BACKGROUNDS[ambiente.toLowerCase()] ?? "#111111";
}

// ─── Palavras por segundo (estimativa TTS PT-BR) ──────────────────────────────
// ~2.5 palavras/segundo em TTS natural PT-BR

function wordsForDuration(seconds: number): { min: number; max: number } {
  const base = Math.round(seconds * 2.5);
  return { min: Math.round(base * 0.85), max: Math.round(base * 1.1) };
}

// ─── Descritores por estilo ──────────────────────────────────────────────────

function estiloDescriptor(
  estilo: "executivo" | "consultor" | "criador",
  avatar: "masculino" | "feminino",
): { personagem: string; tom: string; postura: string } {
  const gen = avatar === "masculino" ? "masculino" : "feminino";

  switch (estilo) {
    case "executivo":
      return {
        personagem: gen === "masculino"
          ? "executivo com roupa social, postura de autoridade corporativa, ambiente profissional"
          : "executiva com roupa social elegante, postura de liderança corporativa, ambiente profissional",
        tom: "direto, assertivo e de autoridade — transmite confiança e credibilidade corporativa",
        postura: "corporativa — fala como CEO ou diretor apresentando solução de alto valor",
      };
    case "consultor":
      return {
        personagem: gen === "masculino"
          ? "consultor especialista com aparência profissional e postura orientadora"
          : "consultora especialista com aparência profissional e postura orientadora",
        tom: "explicativo, didático e empático — transmite expertise e guia o espectador",
        postura: "especialista — fala como quem resolve problemas e orienta com segurança",
      };
    case "criador":
      return {
        personagem: gen === "masculino"
          ? "criador de conteúdo dinâmico com presença de influenciador e apresentador"
          : "criadora de conteúdo dinâmica com presença de influenciadora e apresentadora",
        tom: "próximo, energético e autêntico — transmite entusiasmo e conexão com o público",
        postura: "influenciador — fala de forma natural, direta e cativante como num reel viral",
      };
  }
}

// ─── Roteiro interno via GPT ─────────────────────────────────────────────────

async function buildVideoScript(
  params: VideoGenerationInput,
  signal?: AbortSignal,
): Promise<string> {
  const prompt = params.videoPrompt.trim();
  const { min: minWords, max: maxWords } = wordsForDuration(params.videoDuration);
  const { personagem, tom, postura } = estiloDescriptor(params.videoEstilo, params.videoAvatar);

  const refinedCtx = buildRefinedContext(prompt, `video_${params.videoEstilo}`);

  const ambienteDesc = params.videoAmbiente === "corporativo"
    ? "escritório corporativo moderno com mesa, notebook e ambiente premium"
    : `ambiente de ${params.videoAmbiente} — o personagem está fisicamente neste local, a fala deve refletir este contexto`;

  const systemPrompt = `Você é especialista em roteiros de vídeos de marketing e vendas em português do Brasil.

REGRA ABSOLUTA — HIERARQUIA DE CONTEÚDO:
O assunto central do vídeo DEVE ser exatamente o produto ou tema informado pelo usuário.
Nenhuma instrução interna pode substituir o assunto principal.
O prompt do usuário SEMPRE vence sobre qualquer instrução interna.

CONTEXTO DO MOTOR DE INTERPRETAÇÃO (apoio estrutural):
${refinedCtx.systemEnhancement}

PARÂMETROS DO VÍDEO:
- Personagem: ${personagem}
- Tom de voz: ${tom}
- Postura narrativa: ${postura}
- Cenário/Ambiente: ${ambienteDesc}
- Duração: ${params.videoDuration} segundos de fala (${minWords} a ${maxWords} palavras)
- Idioma: português do Brasil natural e fluente
- Estrutura: gancho impactante (primeiros 20%) → benefício principal do produto (60%) → chamada para ação clara (20% final)

REGRAS DE NATURALIDADE (críticas para TTS soar humano):
- Frases curtas dominam: máximo de 12 a 15 palavras por frase
- Pausas naturais obrigatórias: use vírgulas, pontos e travessões (—) para respiração
- Ritmo variado: alterne frases de 5 a 8 palavras com frases de 10 a 14 palavras
- Conectores de fala real: "Olha,", "E sabe o que é melhor?", "Por quê?", "Simples:", "Veja bem," — introduzem variação natural
- Sem jargão técnico ou corporativo — linguagem de conversa do dia a dia
- Sem frases passivas — sempre ativo e direto: "Você resolve" não "É possível resolver"
- Sem enumerações com "primeiro, segundo, terceiro" — o TTS robotiza listas
- A chamada para ação final deve ser curta e impactante: máximo 10 palavras

REGRAS DE FORMATO:
- Retornar APENAS o texto que o personagem irá falar
- Sem títulos, introduções, explicações, tópicos ou marcadores
- Sem menção a câmera, edição, duração ou produção
- Fala contínua e natural`;

  const userPrompt = `Crie o roteiro de ${params.videoDuration} segundos para o seguinte produto ou tema:

"${prompt}"

${refinedCtx.userEnhancement}

REGRA FINAL: "${prompt}" é o protagonista absoluto. O ambiente é "${params.videoAmbiente}" e o estilo é "${params.videoEstilo}".
O roteiro deve ter entre ${minWords} e ${maxWords} palavras.
Retorne apenas o texto da fala em português do Brasil.`;

  const stream = await openai.chat.completions.create(
    {
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    },
    { signal },
  );

  let script = "";
  let chunkCount = 0;
  for await (const chunk of stream) {
    chunkCount++;
    const content = chunk.choices[0]?.delta?.content;
    if (content) script += content;
  }

  logger.info(
    { chunkCount, scriptLength: script.length, scriptPreview: script.slice(0, 80) },
    "[videoGeneration:diag] script collected",
  );

  if (!script.trim()) throw new Error("Não foi possível gerar o roteiro interno.");

  // Validação de duração: estima palavras e promove se ultrapassar
  const wordCount = script.trim().split(/\s+/).length;
  const estimatedSeconds = Math.round(wordCount / 2.5);

  if (params.videoDuration === 20 && estimatedSeconds > 22) {
    logger.info({ wordCount, estimatedSeconds }, "[videoGeneration] roteiro excede 20s — promovido para 40s");
  } else if (params.videoDuration === 40 && estimatedSeconds > 44) {
    logger.info({ wordCount, estimatedSeconds }, "[videoGeneration] roteiro excede 40s — promovido para 60s");
  } else if (params.videoDuration === 60 && estimatedSeconds > 65) {
    throw new Error("O conteúdo excede o limite máximo de 60 segundos.");
  }

  return script.trim();
}

// ─── Duração efetiva (com promoção) ─────────────────────────────────────────

function effectiveDuration(script: string, requested: number): number {
  const words = script.trim().split(/\s+/).length;
  const estimated = Math.round(words / 2.5);
  if (requested === 20 && estimated > 22) return 40;
  if (requested === 40 && estimated > 44) return 60;
  return requested;
}

// ─── Mock ────────────────────────────────────────────────────────────────────

function buildMockResult(params: VideoGenerationInput): VideoGenerationResult {
  return {
    videoUrl: "",
    durationSeconds: params.videoDuration,
    videoEstilo: params.videoEstilo,
    videoAvatar: params.videoAvatar,
    videoAmbiente: params.videoAmbiente,
    videoFormato: params.videoFormato,
    prompt: params.videoPrompt.trim(),
    generatedAt: new Date().toISOString(),
    isMock: true,
  };
}

// ─── Pipeline principal (SSE) ────────────────────────────────────────────────

export async function streamVideoGeneration(
  params: VideoGenerationInput,
  res: Response,
  clerkUserId: string,
  signal?: AbortSignal,
): Promise<void> {
  const socket = (
    res as unknown as { socket?: { setTimeout: (ms: number) => void } }
  ).socket;
  socket?.setTimeout(300_000);

  setupSSE(res);
  sendSSE(res, { type: "start" });

  const prompt = params.videoPrompt.trim();
  if (!prompt) {
    sendSSEError(res, "O prompt é obrigatório para gerar o vídeo.");
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    logger.info(
      {
        videoEstilo: params.videoEstilo,
        videoAvatar: params.videoAvatar,
        videoAmbiente: params.videoAmbiente,
        videoFormato: params.videoFormato,
        videoDuration: params.videoDuration,
        heygenConfigured: HEYGEN_CONFIGURED,
      },
      "[videoGeneration] iniciando pipeline",
    );
  }

  try {
    sendSSE(res, { type: "progress", message: "Preparando roteiro..." });
    const script = await buildVideoScript(params, signal);
    const duration = effectiveDuration(script, params.videoDuration);

    // ── Modo mock ────────────────────────────────────────────────────────────
    if (!HEYGEN_CONFIGURED) {
      sendSSE(res, { type: "progress", message: "Preparando personagem..." });
      await new Promise<void>((r) => setTimeout(r, 700));
      sendSSE(res, { type: "progress", message: "Preparando vídeo..." });
      await new Promise<void>((r) => setTimeout(r, 900));
      sendSSE(res, { type: "progress", message: "Aguardando processamento..." });
      await new Promise<void>((r) => setTimeout(r, 600));

      const mockResult = buildMockResult(params);
      sendSSE(res, { type: "result", data: mockResult });
      await logAiUsage({
        clerkUserId,
        action: `Vídeo mock: ${prompt.slice(0, 50)} (${params.videoEstilo}, ${params.videoAvatar})`,
        module: "creative",
      });
      sendSSEDone(res);
      return;
    }

    // ── Modo real via HeyGen ─────────────────────────────────────────────────
    sendSSE(res, { type: "progress", message: "Preparando personagem..." });

    const avatarId = AVATAR_IDS[params.videoAvatar];
    const voiceId = VOICE_IDS[params.videoAvatar];
    const background = resolveBackground(params.videoAmbiente);
    const aspectRatio = FORMATO_TO_ASPECT[params.videoFormato] ?? "16:9";

    if (!avatarId || !voiceId) {
      sendSSEError(res, "Configuração de avatar incompleta. Entre em contato com o suporte.");
      return;
    }

    logger.info(
      { avatarId, voiceId, aspectRatio, background, estilo: params.videoEstilo, ambiente: params.videoAmbiente },
      "[videoGeneration] enviando para HeyGen",
    );

    sendSSE(res, { type: "progress", message: "Preparando vídeo..." });
    const { videoId } = await generateVideo({ avatarId, voiceId, script, background, aspectRatio });

    sendSSE(res, { type: "progress", message: "Aguardando processamento..." });
    const videoUrl = await pollUntilDone(
      videoId,
      () => sendSSE(res, { type: "progress", message: "Processando vídeo..." }),
      60,
      3_000,
    );

    const finalResult: VideoGenerationResult = {
      videoUrl,
      durationSeconds: duration,
      videoEstilo: params.videoEstilo,
      videoAvatar: params.videoAvatar,
      videoAmbiente: params.videoAmbiente,
      videoFormato: params.videoFormato,
      prompt,
      generatedAt: new Date().toISOString(),
      isMock: false,
    };

    sendSSE(res, { type: "result", data: finalResult });
    await logAiUsage({
      clerkUserId,
      action: `Vídeo gerado: ${prompt.slice(0, 50)} (${params.videoEstilo}, ${params.videoAvatar}, ${params.videoFormato}, ${duration}s)`,
      module: "creative",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      res.end();
      return;
    }
    const rawMsg = err instanceof Error ? err.message : String(err);
    logger.error(
      {
        errName: err instanceof Error ? err.name : typeof err,
        errMsg: rawMsg,
        errStack: err instanceof Error ? err.stack?.slice(0, 400) : undefined,
      },
      "[videoGeneration] pipeline error",
    );
    const userMsg =
      rawMsg.startsWith("Não foi possível") ||
      rawMsg.startsWith("Tempo esgotado") ||
      rawMsg.startsWith("Configuração de avatar") ||
      rawMsg.startsWith("O conteúdo excede")
        ? rawMsg
        : "Não foi possível gerar o vídeo. Seus créditos serão devolvidos automaticamente.";
    sendSSEError(res, userMsg);
    return;
  }

  sendSSEDone(res);
}
