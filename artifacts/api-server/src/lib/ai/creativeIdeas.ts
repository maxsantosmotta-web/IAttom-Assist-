import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";

interface CreativeIdeasInput {
  prompt: string;
  style?: string;
  product?: string;
  targetAudience?: string;
}
import { logAiUsage } from "./logger.js";

export interface CreativeConcept {
  id: number;
  label: string;
  format: string;
  concept: string;
  visualDirection: string;
  copyHook: string;
  bodyText: string;
  cta: string;
  emotionalTrigger: string;
  bestPlatform: string;
  imagePrompt: string;
}

export interface CreativeIdeasResult {
  concepts: CreativeConcept[];
  overarchingTheme: string;
  colorPalette: string;
  typographyDirection: string;
  brandVoiceNotes: string;
}

export async function streamCreativeIdeas(
  params: CreativeIdeasInput,
  res: Response,
  clerkUserId: string,
): Promise<void> {
  setupSSE(res);
  sendSSE(res, { type: "start" });

  const systemPrompt = `You are a world-class creative director for digital advertising. You develop breakthrough creative concepts that stop the scroll, build brand desire, and drive conversions.

Your output must be a valid JSON object — no markdown, no code blocks, just raw JSON.

Return this exact structure:
{
  "concepts": [
    {
      "id": number (1-4),
      "label": string (creative name, e.g. "Hero Banner", "Story Ad", "Product Hero", "Social Proof"),
      "format": string (e.g. "1080x1080 square", "9:16 story", "16:9 banner"),
      "concept": string (1-2 sentences describing the creative concept),
      "visualDirection": string (detailed visual description for the designer),
      "copyHook": string (the attention-grabbing headline/hook text),
      "bodyText": string (supporting copy text),
      "cta": string (call-to-action button text),
      "emotionalTrigger": string (the core emotion being activated),
      "bestPlatform": string (where this creative works best),
      "imagePrompt": string (detailed AI image generation prompt for this concept)
    }
  ],
  "overarchingTheme": string (the unifying creative theme across all concepts),
  "colorPalette": string (3-4 specific hex colors with names),
  "typographyDirection": string (font style and hierarchy guidance),
  "brandVoiceNotes": string (tone and messaging guidance)
}

Create 4 distinct creative concepts. Each must feel like it came from a top-tier agency.`;

  const userPrompt = `Generate premium creative ad concepts for:
Brief: "${params.prompt}"
${params.product ? `Product: ${params.product}` : ""}
${params.style ? `Visual style: ${params.style}` : ""}
${params.targetAudience ? `Target audience: ${params.targetAudience}` : ""}

Create 4 creative concepts that are visually striking, on-brand, and conversion-focused.`;

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

    const result: CreativeIdeasResult = JSON.parse(fullResponse);
    sendSSE(res, { type: "result", data: result });
    await logAiUsage({ clerkUserId, action: `Creatives generated: ${params.prompt.slice(0, 50)}`, module: "creative" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    sendSSEError(res, msg);
    return;
  }

  sendSSEDone(res);
}
