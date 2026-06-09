/**
 * HeyGen API Client — IAttom Assist
 *
 * Endpoint: POST /v3/videos — payload FLAT com type:"avatar" na raiz (Avatar IV)
 *
 * Modo seguro: HEYGEN_CONFIGURED = false → pipeline opera em mock sem erros.
 *
 * Variáveis para ativar modo real:
 *   HEYGEN_API_KEY           — API key do dashboard HeyGen
 *   HEYGEN_VOICE_MALE_ID     — voice_id PT-BR masculino (GET /v3/voices)
 *   HEYGEN_VOICE_FEMALE_ID   — voice_id PT-BR feminino  (GET /v3/voices)
 *
 * Avatares: Digital Twin da conta — confirmados via GET /v3/avatars/looks?avatar_type=digital_twin
 *   Todos têm supported_api_engines: ["avatar_v","avatar_iv"] + tags: ["AvatarTags.AVATAR_IV"]
 */

import { logger } from "./logger.js";

const HEYGEN_BASE_URL = "https://api.heygen.com";

export const HEYGEN_CONFIGURED = !!process.env.HEYGEN_API_KEY;

// ─── Biblioteca Oficial de Avatares IAttom ────────────────────────────────────
//
// Todos os avatar_ids abaixo são Digital Twin da conta HeyGen.
// Confirmados via GET /v3/avatars/looks?avatar_type=digital_twin (2025-06-09).
// Todos têm: supported_api_engines: ["avatar_v","avatar_iv"] + status: "completed"
// Todos são portrait (preferred_orientation: "portrait") — nativos em 9:16.
//
// Estrutura:
//   estilo     — executivo | consultor | criador
//   genero     — masculino | feminino
//   avatarId   — ID real Digital Twin da conta
//   nome       — nome do personagem na HeyGen
//   categoria  — rótulo da biblioteca IAttom
//   nativo916  — true para portrait (todos neste catálogo)

export interface OfficialAvatar {
  estilo: "executivo" | "consultor" | "criador";
  genero: "masculino" | "feminino";
  avatarId: string;
  nome: string;
  categoria: string;
  nativo916: boolean;
}

export const OFFICIAL_AVATAR_CATALOG: OfficialAvatar[] = [
  {
    estilo:    "executivo",
    genero:    "masculino",
    avatarId:  "ad8f529c87f64b1b82c24a3938c504f6",
    nome:      "Ben",
    categoria: "Executivo Masculino",
    nativo916: true,
  },
  {
    estilo:    "consultor",
    genero:    "masculino",
    avatarId:  "222ff1a5d33645e8ab97d0f07fad94e7",
    nome:      "Eric",
    categoria: "Consultor Masculino",
    nativo916: true,
  },
  {
    estilo:    "criador",
    genero:    "masculino",
    avatarId:  "3f5c6df32ece4bb5bb91fbeba36f88b2",
    nome:      "Marcus",
    categoria: "Criador Masculino",
    nativo916: true,
  },
  {
    estilo:    "executivo",
    genero:    "feminino",
    avatarId:  "15141bd577c043cea1d58609abf55a74",
    nome:      "Silvia",
    categoria: "Executiva Feminina",
    nativo916: true,
  },
  {
    estilo:    "consultor",
    genero:    "feminino",
    avatarId:  "3e5d7c980b4146f3947806b917d54c32",
    nome:      "Diana",
    categoria: "Consultora Feminina",
    nativo916: true,
  },
  {
    estilo:    "criador",
    genero:    "feminino",
    avatarId:  "7ff6a5e83a864eb9a2560bc967ef2876",
    nome:      "Stephanie",
    categoria: "Criadora Feminina",
    nativo916: true,
  },
];

// ─── Seleção por estilo + gênero ─────────────────────────────────────────────
//
// Retorna o avatar_id oficial para a combinação estilo × gênero.
// Preparado para futura seleção manual no módulo de vídeo.
// Fallback: avatar padrão do gênero quando a combinação não for encontrada.

export function getOfficialAvatarId(
  estilo: "executivo" | "consultor" | "criador",
  genero: "masculino" | "feminino",
): string {
  const found = OFFICIAL_AVATAR_CATALOG.find(
    (a) => a.estilo === estilo && a.genero === genero,
  );
  if (found) return found.avatarId;

  // Fallback por gênero caso a combinação não exista no catálogo
  const fallback = OFFICIAL_AVATAR_CATALOG.find((a) => a.genero === genero);
  return fallback?.avatarId ?? OFFICIAL_AVATAR_CATALOG[0].avatarId;
}

// ─── Mapeamento: gênero → avatar_id (fallback legado) ────────────────────────
//
// Usado apenas pelo fallback de getOfficialAvatarId quando a combinação
// estilo+gênero não for encontrada no OFFICIAL_AVATAR_CATALOG.
// Digital Twin confirmados via GET /v3/avatars/looks?avatar_type=digital_twin.
//
//   masculino → Ben    (ad8f529c87f64b1b82c24a3938c504f6)
//   feminino  → Silvia (15141bd577c043cea1d58609abf55a74)

const DEFAULT_AVATAR_MALE   = "ad8f529c87f64b1b82c24a3938c504f6";  // Ben   — Digital Twin Masculino
const DEFAULT_AVATAR_FEMALE = "15141bd577c043cea1d58609abf55a74";   // Silvia — Digital Twin Feminino

export const AVATAR_IDS: Record<"masculino" | "feminino", string> = {
  masculino: DEFAULT_AVATAR_MALE,
  feminino:  DEFAULT_AVATAR_FEMALE,
};

// ─── Vozes PT-BR selecionadas ─────────────────────────────────────────────────
//
// Confirmadas via GET /v2/voices (2025-06-09).
// Critérios: Portuguese, neutro brasileiro, sem sotaque regional,
//            tom profissional/comercial, support_interactive_avatar: true.
//
//   masculino → Fabio - Newscaster    (1956ee743a61677602bbef9cfc48ebb9)
//               Locução jornalística PT-BR — neutro, broadcast-quality
//   feminino  → Brenda - Professional (00988b7d451d0722635ff7b2b9540a7b)
//               Tom profissional PT-BR — natural, comercial
//
// HEYGEN_VOICE_MALE_ID / HEYGEN_VOICE_FEMALE_ID mantidos como override opcional.

export const VOICE_IDS: Record<"masculino" | "feminino", string> = {
  masculino: process.env.HEYGEN_VOICE_MALE_ID  || "1956ee743a61677602bbef9cfc48ebb9",
  feminino:  process.env.HEYGEN_VOICE_FEMALE_ID || "00988b7d451d0722635ff7b2b9540a7b",
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface HeyGenVideoPayload {
  avatarId: string;
  voiceId: string;
  script: string;
  /** Hex color (ex: "#1c2333") ou URL pública de imagem sem query params */
  background: string;
  /** Aspect ratio do vídeo: "16:9" | "1:1" | "9:16" */
  aspectRatio?: string;
}

export interface HeyGenVideoStatus {
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
  failureCode?: string;
}

// ─── Helper: extrai mensagem legível do erro HeyGen ──────────────────────────

function extractHeygenError(body: Record<string, unknown>): string {
  if (body.error && typeof body.error === "object") {
    const e = body.error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.detail === "string") return e.detail;
  }
  if (typeof body.message === "string") return body.message;
  if (typeof body.detail === "string") return body.detail;
  return "Erro desconhecido da API HeyGen.";
}

// ─── Dimensões por aspect ratio ──────────────────────────────────────────────

function dimensionForAspect(aspectRatio: string): { width: number; height: number } {
  if (aspectRatio === "9:16") return { width: 1080, height: 1920 };
  if (aspectRatio === "1:1")  return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 }; // 16:9 default
}

// ─── Refinamento de script PT-BR para TTS natural ────────────────────────────
//
// Objetivo: reduzir leitura mecânica adicionando pausas naturais e quebrando
// períodos excessivamente longos antes de enviar ao HeyGen.
//
// Estratégia:
//   1. Adiciona vírgula antes de conjunções adversativas/explicativas comuns
//      que costumam ser lidas sem pausa em TTS: "mas", "porém", "então", "assim",
//      "portanto", "inclusive", "além disso", "por isso", "ou seja"
//   2. Quebra frases > 120 chars em ponto de conjunção ou pontuação natural
//   3. Garante espaçamento limpo após pontuação

function refineScriptPtBr(text: string): string {
  // 1. Limpar espaços múltiplos
  let s = text.replace(/\s{2,}/g, " ").trim();

  // 2. Adicionar vírgula antes de conjunções sem vírgula prévia
  const junctions = ["mas ", "porém ", "então ", "assim ", "portanto ", "inclusive ", "além disso ", "por isso ", "ou seja "];
  for (const j of junctions) {
    // Só adiciona vírgula se o char antes não for já pontuação
    const pattern = new RegExp(`([^,;:.!?])\\s+(?=${j})`, "gi");
    s = s.replace(pattern, (_, before) => `${before}, `);
  }

  // 3. Garantir espaço após pontuação
  s = s.replace(/([.!?;,])([^\s])/g, "$1 $2");

  // 4. Garantir que o script termina com ponto final
  if (s.length > 0 && !/[.!?]$/.test(s)) s += ".";

  return s;
}

// ─── Geração de vídeo (POST /v3/videos) ──────────────────────────────────────
//
// Payload flat — "type" na raiz, sem video_inputs/character/dimension:
//
//   {
//     "type":         "avatar",
//     "avatar_id":    "...",
//     "script":       "...",
//     "voice_id":     "...",
//     "aspect_ratio": "16:9" | "9:16" | "1:1",
//     "resolution":   "1080p",
//     "voice_speed":  1.25,
//     "background":   { "type": "color", "value": "#hex" }
//   }

export async function generateVideo(payload: HeyGenVideoPayload): Promise<{ videoId: string }> {
  const apiKey = process.env.HEYGEN_API_KEY!;

  const aspectRatio = payload.aspectRatio ?? "9:16";

  // Aplicar refinamento de prosódia PT-BR antes de enviar ao HeyGen
  const refinedScript = refineScriptPtBr(payload.script);

  const background = { type: "color", value: "#111111" };

  const body = {
    type:         "avatar",
    avatar_id:    payload.avatarId,
    script:       refinedScript,
    voice_id:     payload.voiceId,
    aspect_ratio: aspectRatio,
    resolution:   "1080p",
    voice_speed:  1.25,
    background,
  };

  logger.info(
    {
      HEYGEN_FINAL_PAYLOAD: {
        avatar_id:        payload.avatarId,
        voice_id:         payload.voiceId,
        aspect_ratio:     aspectRatio,
        background_type:  "color",
        background_value: "#111111",
        script_length:    payload.script.length,
        script_preview:   payload.script.slice(0, 60),
      },
    },
    "[heygenClient] HEYGEN_FINAL_PAYLOAD enviado para v3/videos",
  );

  const res = await fetch(`${HEYGEN_BASE_URL}/v3/videos`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as Record<string, unknown>;
    const humanMsg = extractHeygenError(errBody);
    logger.error(
      { status: res.status, errBody },
      "[heygenClient] erro na criação do vídeo",
    );
    throw new Error(`Erro HeyGen (${res.status}): ${humanMsg}`);
  }

  const data = await res.json() as {
    data?: { video_id?: string; id?: string };
    video_id?: string;
  };

  const videoId =
    data.data?.video_id ??
    data.data?.id ??
    data.video_id ??
    "";

  if (!videoId) {
    logger.error({ data }, "[heygenClient] resposta sem video_id");
    throw new Error("HeyGen não retornou um video_id válido.");
  }

  logger.info(
    { videoId, aspectRatio, avatarId: payload.avatarId },
    "[HEYGEN_VIDEO_CREATED] video_id=" + videoId,
  );
  return { videoId };
}

// ─── Status do vídeo (v3) ────────────────────────────────────────────────────
//
// GET /v3/videos/{video_id}
// Resposta: { data: { id, status, video_url, failure_message, failure_code } }

export async function getVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
  const apiKey = process.env.HEYGEN_API_KEY!;

  const res = await fetch(
    `${HEYGEN_BASE_URL}/v3/videos/${encodeURIComponent(videoId)}`,
    { headers: { "X-Api-Key": apiKey } },
  );

  if (!res.ok) {
    throw new Error(`HeyGen status ${res.status} para video_id ${videoId}`);
  }

  const data = await res.json() as {
    data?: {
      status?: string;
      video_url?: string;
      failure_message?: string;
      failure_code?: string;
      error?: string;
      width?: number;
      height?: number;
    };
  };

  const d = data.data ?? {};

  // Log dimensões reais quando disponíveis (útil para diagnóstico de 9:16)
  if (d.status === "completed" && (d.width ?? d.height)) {
    logger.info(
      { videoId, width: d.width, height: d.height, videoUrl: d.video_url?.slice(0, 80) },
      "[heygenClient] dimensões reais do vídeo gerado",
    );
  }

  return {
    status:      (d.status ?? "pending") as HeyGenVideoStatus["status"],
    videoUrl:    d.video_url,
    error:       d.failure_message ?? d.error,
    failureCode: d.failure_code,
  };
}

// ─── Polling até conclusão ────────────────────────────────────────────────────

// Polling: 120 tentativas × 5 s = 10 minutos de espera máxima.
// Statuses intermediários aceitos: "waiting" | "pending" | "processing"
export async function pollUntilDone(
  videoId: string,
  onProgress: (status: string) => void,
  maxAttempts = 120,
  intervalMs = 5_000,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusData = await getVideoStatus(videoId);

    logger.info(
      { videoId, attempt: attempt + 1, maxAttempts, status: statusData.status },
      "[HEYGEN_POLL] attempt=" + (attempt + 1) + " status=" + statusData.status,
    );

    if (statusData.status === "completed" && statusData.videoUrl) {
      logger.info(
        { videoId, attempt: attempt + 1, videoUrl: statusData.videoUrl.slice(0, 80) },
        "[HEYGEN_COMPLETED] video_id=" + videoId,
      );
      return statusData.videoUrl;
    }

    if (statusData.status === "failed") {
      const failureCode = statusData.failureCode ?? "UNKNOWN";
      const failureMsg  = statusData.error ?? "Falha na geração do vídeo.";
      logger.error(
        { videoId, failureCode, failureMsg },
        "[HEYGEN_FAILED] video_id=" + videoId +
        " failure_code=" + failureCode +
        " failure_message=" + failureMsg,
      );
      throw new Error(`Erro HeyGen: ${failureMsg} (código: ${failureCode})`);
    }

    onProgress(statusData.status);
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }

  // Timeout real: vídeo pode ainda estar processando — informa video_id ao usuário
  logger.warn(
    { videoId, maxAttempts, totalMs: maxAttempts * intervalMs },
    "[HEYGEN_TIMEOUT] video_id=" + videoId + " esgotou " + maxAttempts + " tentativas",
  );
  throw new Error(
    `O vídeo ainda está processando na HeyGen (video_id: ${videoId}). Tente atualizar em alguns minutos.`,
  );
}
