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

function wordsForDuration(seconds: number): { min: number; max: number } {
  const base = Math.round(seconds * 2.5);
  return { min: Math.round(base * 0.85), max: Math.round(base * 1.1) };
}

// ─── Descritores por estilo ──────────────────────────────────────────────────

function estiloDescriptor(
  estilo: "executivo" | "consultor" | "criador",
  avatar: "masculino" | "feminino",
): { tom: string; postura: string } {
  switch (estilo) {
    case "executivo":
      return {
        tom: "direto e confiante, transmitindo credibilidade profissional",
        postura: "fala como especialista que apresenta uma solução de valor, com autoridade e clareza",
      };
    case "consultor":
      return {
        tom: "explicativo e empático, guiando o espectador com clareza",
        postura: "fala como quem orienta e resolve problemas, com expertise e cuidado",
      };
    case "criador":
      return {
        tom: "próximo e autêntico, com entusiasmo natural e conexão com o público",
        postura: "fala de forma direta e cativante, como numa conversa real com o espectador",
      };
  }
  const _: never = estilo;
  return _;
}

// ─── Helper: uma tentativa de geração via OpenAI (streaming) ─────────────────
// Captura delta.content, delta.refusal e finish_reason em cada chunk.

interface ScriptAttemptResult {
  script: string;
  refusal: string | null;
  finishReason: string | null;
  chunkCount: number;
}

async function attemptScriptGeneration(
  messages: { role: "system" | "user"; content: string }[],
  signal?: AbortSignal,
): Promise<ScriptAttemptResult> {
  const stream = await openai.chat.completions.create(
    {
      model: "gpt-5-mini",
      max_completion_tokens: 1500,
      messages,
      stream: true,
    },
    { signal },
  );

  let script = "";
  let refusal: string | null = null;
  let finishReason: string | null = null;
  let chunkCount = 0;

  for await (const chunk of stream) {
    chunkCount++;
    const delta = chunk.choices[0]?.delta as {
      content?: string | null;
      refusal?: string | null;
    } | undefined;
    const fr = chunk.choices[0]?.finish_reason;
    if (fr) finishReason = fr;
    if (delta?.content) script += delta.content;
    if (delta?.refusal) refusal = (refusal ?? "") + delta.refusal;
  }

  return { script: script.trim(), refusal, finishReason, chunkCount };
}

// ─── Roteiro interno via GPT (com retry automático) ──────────────────────────

async function buildVideoScript(
  params: VideoGenerationInput,
  signal?: AbortSignal,
): Promise<string> {
  const prompt = params.videoPrompt.trim();
  const { min: minWords, max: maxWords } = wordsForDuration(params.videoDuration);
  const { tom, postura } = estiloDescriptor(params.videoEstilo, params.videoAvatar);

  // ── Tentativa 1: prompt completo ─────────────────────────────────────────
  const systemPrompt = `Você escreve roteiros de vídeos de marketing em português do Brasil.
Sua única tarefa é escrever o texto que o personagem irá falar no vídeo.

TOM: ${tom}
POSTURA: ${postura}
AMBIENTE: ${params.videoAmbiente}
DURAÇÃO: ${params.videoDuration} segundos (entre ${minWords} e ${maxWords} palavras)
ESTRUTURA: abertura que prende atenção → apresentação do produto com benefícios reais → chamada para ação

REGRAS DE ESCRITA:
- Frases curtas: máximo de 12 palavras por frase
- Pausas com vírgulas e pontos — ritmo natural de fala
- Linguagem acessível, sem termos técnicos desnecessários
- Voz ativa: "você resolve" não "é possível resolver"
- Sem listas numeradas — fala contínua e natural
- Sem menção a câmera, edição, produção ou duração

RETORNAR: apenas o texto da fala, em português. Nada mais.`;

  const userPrompt = `Produto ou serviço: "${prompt}"

Escreva o roteiro de ${params.videoDuration} segundos.
Entre ${minWords} e ${maxWords} palavras.
Apenas o texto da fala.`;

  const attempt1 = await attemptScriptGeneration(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    signal,
  );

  logger.info(
    {
      attempt: 1,
      chunkCount: attempt1.chunkCount,
      scriptLength: attempt1.script.length,
      scriptPreview: attempt1.script.slice(0, 80),
      refusal: attempt1.refusal,
      finishReason: attempt1.finishReason,
      estilo: params.videoEstilo,
    },
    "[videoGeneration:diag] tentativa 1 de roteiro",
  );

  if (attempt1.script) {
    return attempt1.script;
  }

  // Logar a causa do script vazio
  if (attempt1.refusal) {
    logger.warn(
      { refusal: attempt1.refusal, finishReason: attempt1.finishReason },
      "[videoGeneration] recusa detectada na tentativa 1 — iniciando retry simplificado",
    );
  } else {
    logger.warn(
      { chunkCount: attempt1.chunkCount, finishReason: attempt1.finishReason },
      "[videoGeneration] roteiro vazio (sem recusa explícita) — iniciando retry simplificado",
    );
  }

  // ── Tentativa 2: prompt simplificado (retry) ──────────────────────────────
  const simpleSystem = `Você escreve roteiros de marketing em português do Brasil. Escreva apenas o texto falado. Nada mais.`;
  const simpleUser = `Escreva um texto de ${params.videoDuration} segundos sobre: "${prompt}". Entre ${minWords} e ${maxWords} palavras. Apenas a fala, em português do Brasil.`;

  const attempt2 = await attemptScriptGeneration(
    [
      { role: "system", content: simpleSystem },
      { role: "user", content: simpleUser },
    ],
    signal,
  );

  logger.info(
    {
      attempt: 2,
      chunkCount: attempt2.chunkCount,
      scriptLength: attempt2.script.length,
      scriptPreview: attempt2.script.slice(0, 80),
      refusal: attempt2.refusal,
      finishReason: attempt2.finishReason,
    },
    "[videoGeneration:diag] tentativa 2 de roteiro (retry)",
  );

  if (attempt2.script) {
    logger.info({}, "[videoGeneration] roteiro obtido no retry simplificado");
    return attempt2.script;
  }

  // Ambas as tentativas falharam
  if (attempt2.refusal) {
    logger.error(
      { refusal1: attempt1.refusal, refusal2: attempt2.refusal },
      "[videoGeneration] recusa em ambas as tentativas",
    );
    throw new Error("Não foi possível gerar o roteiro. Tente simplificar o prompt.");
  }

  throw new Error("Não foi possível gerar o roteiro. Tente simplificar o prompt.");
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

  try {
    sendSSE(res, { type: "progress", message: "Preparando roteiro..." });
    const script = await buildVideoScript(params, signal);

    // ── Garantia: HeyGen só é chamada com script válido ──────────────────────
    if (!script || script.trim().length === 0) {
      sendSSEError(res, "Não foi possível gerar o roteiro. Tente simplificar o prompt.");
      return;
    }

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
      { avatarId, voiceId, aspectRatio, background, estilo: params.videoEstilo, scriptLength: script.length },
      "[videoGeneration] roteiro válido — enviando para HeyGen",
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
