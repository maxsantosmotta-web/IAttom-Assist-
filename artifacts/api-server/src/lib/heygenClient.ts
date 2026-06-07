/**
 * HeyGen API Client — BLOCO 2A
 * Engine: Avatar V (máxima qualidade)
 *
 * Modo seguro: se HEYGEN_API_KEY não estiver configurada,
 * HEYGEN_CONFIGURED = false → pipeline opera em mock sem erros.
 *
 * Avatar IDs e Voice IDs: configurar via env após setup HeyGen (BLOCO 2B).
 * Variáveis necessárias em BLOCO 2B:
 *   HEYGEN_API_KEY
 *   HEYGEN_AVATAR_MALE_ID
 *   HEYGEN_AVATAR_FEMALE_ID
 *   HEYGEN_VOICE_MALE_ID
 *   HEYGEN_VOICE_FEMALE_ID
 */

const HEYGEN_BASE_URL = "https://api.heygen.com";

export const HEYGEN_CONFIGURED =
  !!process.env.HEYGEN_API_KEY &&
  !!process.env.HEYGEN_AVATAR_MALE_ID &&
  !!process.env.HEYGEN_AVATAR_FEMALE_ID &&
  !!process.env.HEYGEN_VOICE_MALE_ID &&
  !!process.env.HEYGEN_VOICE_FEMALE_ID;

// IDs dos avatares oficiais — preencher após setup HeyGen (BLOCO 2B)
export const AVATAR_IDS: Record<"masculino" | "feminino", string> = {
  masculino: process.env.HEYGEN_AVATAR_MALE_ID ?? "",
  feminino:  process.env.HEYGEN_AVATAR_FEMALE_ID ?? "",
};

// IDs das vozes PT-BR — preencher após setup HeyGen (BLOCO 2B)
export const VOICE_IDS: Record<"masculino" | "feminino", string> = {
  masculino: process.env.HEYGEN_VOICE_MALE_ID ?? "",
  feminino:  process.env.HEYGEN_VOICE_FEMALE_ID ?? "",
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface HeyGenVideoPayload {
  avatarId: string;
  voiceId: string;
  script: string;
  /** Hex color (ex: "#1c2333") ou URL pública de imagem sem query params */
  background: string;
  dimension?: { width: number; height: number };
}

export interface HeyGenVideoStatus {
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

// ─── Geração de vídeo (v3 — Avatar V) ───────────────────────────────────────

export async function generateVideo(payload: HeyGenVideoPayload): Promise<{ videoId: string }> {
  const apiKey = process.env.HEYGEN_API_KEY!;

  const isColor = payload.background.startsWith("#");

  const body: Record<string, unknown> = {
    type: "avatar",
    avatar_id: payload.avatarId,
    engine: { type: "avatar_v" },   // Avatar V — máxima qualidade disponível
    script: payload.script,
    voice_id: payload.voiceId,
    output_format: "mp4",
    dimension: payload.dimension ?? { width: 1280, height: 720 },
    caption: false,
    background: isColor
      ? { type: "color", value: payload.background }
      : { type: "image", url: payload.background },
  };

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
    throw new Error(`HeyGen API ${res.status}: ${JSON.stringify(errBody)}`);
  }

  const data = await res.json() as {
    data?: { video_id?: string };
    video_id?: string;
  };

  const videoId = data.data?.video_id ?? data.video_id ?? "";
  if (!videoId) throw new Error("HeyGen não retornou um video_id válido.");

  return { videoId };
}

// ─── Status do vídeo ─────────────────────────────────────────────────────────

export async function getVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
  const apiKey = process.env.HEYGEN_API_KEY!;

  const res = await fetch(
    `${HEYGEN_BASE_URL}/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
    { headers: { "X-Api-Key": apiKey } },
  );

  if (!res.ok) {
    throw new Error(`HeyGen status ${res.status} para video_id ${videoId}`);
  }

  const data = await res.json() as {
    data?: { status?: string; video_url?: string; error?: string };
  };

  const d = data.data ?? {};
  return {
    status: (d.status ?? "pending") as HeyGenVideoStatus["status"],
    videoUrl: d.video_url,
    error: d.error,
  };
}

// ─── Polling até conclusão ───────────────────────────────────────────────────

export async function pollUntilDone(
  videoId: string,
  onProgress: (status: string) => void,
  maxAttempts = 60,
  intervalMs = 3_000,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusData = await getVideoStatus(videoId);

    if (statusData.status === "completed" && statusData.videoUrl) {
      return statusData.videoUrl;
    }

    if (statusData.status === "failed") {
      throw new Error(statusData.error ?? "HeyGen: falha na geração do vídeo.");
    }

    onProgress(statusData.status);
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    "Tempo esgotado na geração do vídeo. Seus créditos serão devolvidos automaticamente.",
  );
}
