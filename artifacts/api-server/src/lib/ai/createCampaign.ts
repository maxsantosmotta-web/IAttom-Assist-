import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";

interface CreateCampaignInput {
  product: string;
  audience?: string;
  goal?: string;
  platforms?: string[];
  budget?: string;
}
import { logAiUsage } from "./logger.js";

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

export async function streamCreateCampaign(
  params: CreateCampaignInput,
  res: Response,
  clerkUserId: string,
): Promise<void> {
  setupSSE(res);
  sendSSE(res, { type: "start" });

  const systemPrompt = `You are a world-class direct response marketer and campaign strategist. You create campaigns that generate measurable ROI, combining psychological triggers with precision targeting.

Your output must be a valid JSON object — no markdown, no code blocks, just raw JSON.

Return this exact structure:
{
  "headline": string (attention-grabbing, benefit-focused headline),
  "subheadline": string (supporting statement that builds on the headline),
  "cta": string (compelling call-to-action),
  "audience": string (precise audience description),
  "channels": string[] (3-5 recommended channels),
  "budget": string (budget recommendation with reasoning),
  "copy": {
    "facebook": string (Facebook ad copy, 2-3 sentences),
    "instagram": string (Instagram caption with hooks),
    "google": string (Google ad headline + description),
    "email": string (email subject + preview text + body opening),
    "tiktok": string (TikTok hook + script direction)
  },
  "keyMessages": string[] (3 core messages to hammer throughout),
  "launchTimeline": string (recommended launch sequence),
  "uniqueAngle": string (the unique positioning angle),
  "objectionHandling": string (how to handle the #1 objection)
}

Every piece of copy must be punchy, conversion-focused, and psychologically compelling. No generic marketing speak.`;

  const userPrompt = `Create a full marketing campaign for:
Product/Brand: "${params.product}"
${params.audience ? `Target audience: ${params.audience}` : ""}
${params.goal ? `Campaign goal: ${params.goal}` : "Drive sales"}
${params.platforms?.length ? `Preferred platforms: ${params.platforms.join(", ")}` : ""}
${params.budget ? `Budget: ${params.budget}` : ""}

Create a complete, high-converting campaign with platform-specific copy that feels tailored, not templated.`;

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
    await logAiUsage({ clerkUserId, action: `Campaign created: ${params.product}`, module: "campaign" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    sendSSEError(res, msg);
    return;
  }

  sendSSEDone(res);
}
