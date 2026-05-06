import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";

interface VideoScriptInput {
  product: string;
  format?: string;
  duration?: string;
  hook?: string;
  style?: string;
}
import { logAiUsage } from "./logger.js";

export interface ScriptScene {
  time: string;
  visual: string;
  script: string;
  emotion: string;
  direction: string;
}

export interface VideoScriptResult {
  title: string;
  duration: string;
  hooks: string[];
  scenes: ScriptScene[];
  voiceoverStyle: string;
  musicMood: string;
  editingPace: string;
  captionStyle: string;
  viralTrigger: string;
  distributionTips: string[];
}

export async function streamVideoScript(
  params: VideoScriptInput,
  res: Response,
  clerkUserId: string,
): Promise<void> {
  setupSSE(res);
  sendSSE(res, { type: "start" });

  const duration = params.duration ?? "30s";
  const format = params.format ?? "standard ad";

  const systemPrompt = `You are an elite video scriptwriter specializing in viral content and high-converting video ads. You craft scripts that captivate in the first 3 seconds and drive action by the end.

Your output must be a valid JSON object — no markdown, no code blocks, just raw JSON.

Return this exact structure:
{
  "title": string (creative script name),
  "duration": string (e.g. "30s", "60s"),
  "hooks": string[] (3 alternative opening hooks — the first 3 seconds that stop the scroll),
  "scenes": [
    {
      "time": string (e.g. "0-3s", "3-8s"),
      "visual": string (detailed shot description),
      "script": string (exact voiceover or on-screen text),
      "emotion": string (emotion to evoke in this moment),
      "direction": string (acting/filming direction notes)
    }
  ],
  "voiceoverStyle": string (tone, pace, character of the VO),
  "musicMood": string (music style and tempo guidance),
  "editingPace": string (cut rhythm and editing style),
  "captionStyle": string (caption style for accessibility/retention),
  "viralTrigger": string (the key element designed to drive shares/saves),
  "distributionTips": string[] (2-3 platform-specific distribution tips)
}

Write scripts that feel like they were produced for a major brand campaign. Every scene must have clear purpose and emotional impact.`;

  const userPrompt = `Write a video script for:
Product/Brand: "${params.product}"
Format: ${format}
Duration: ${duration}
${params.hook ? `Hook idea: ${params.hook}` : ""}
${params.style ? `Style: ${params.style}` : ""}

Create a complete, production-ready script with 4-6 scenes that maximizes viewer retention and drives conversions.`;

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

    const result: VideoScriptResult = JSON.parse(fullResponse);
    sendSSE(res, { type: "result", data: result });
    await logAiUsage({ clerkUserId, action: `Script created: ${params.product}`, module: "video_script" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    sendSSEError(res, msg);
    return;
  }

  sendSSEDone(res);
}
