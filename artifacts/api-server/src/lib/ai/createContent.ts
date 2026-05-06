import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";

interface CreateContentInput {
  topic: string;
  tone?: string;
  contentTypes?: string[];
  additionalContext?: string;
}
import { logAiUsage } from "./logger.js";

export interface ContentResult {
  blog: string;
  social: string;
  email: string;
  tweetThread: string;
  smsText: string;
  seoTitle: string;
  seoDescription: string;
}

export async function streamCreateContent(
  params: CreateContentInput,
  res: Response,
  clerkUserId: string,
): Promise<void> {
  setupSSE(res);
  sendSSE(res, { type: "start" });

  const toneInstruction = params.tone
    ? `Tone: ${params.tone}`
    : "Tone: bold, direct, authoritative — but human";

  const systemPrompt = `You are an elite copywriter and content strategist for DTC brands and e-commerce businesses. You write content that converts browsers into buyers, using storytelling, social proof, and psychological triggers.

Your output must be a valid JSON object — no markdown, no code blocks, just raw JSON.

Return this exact structure:
{
  "blog": string (full blog post, 400-600 words, with sections, engaging and SEO-optimized),
  "social": string (Instagram/Facebook caption with hook, body, CTA, and hashtags),
  "email": string (complete email: subject line, preview text, and full body with opening, middle, CTA),
  "tweetThread": string (3-5 tweet thread, each tweet on new line starting with number),
  "smsText": string (SMS marketing message, max 160 chars),
  "seoTitle": string (SEO page title, 60 chars max),
  "seoDescription": string (meta description, 155 chars max)
}

Write content that sounds like it was created by a veteran copywriter — specific, compelling, and human.`;

  const userPrompt = `Create a full content suite for:
Topic/Product: "${params.topic}"
${toneInstruction}
${params.additionalContext ? `Context: ${params.additionalContext}` : ""}
${params.contentTypes?.length ? `Priority content: ${params.contentTypes.join(", ")}` : ""}

Make every piece feel premium, brand-specific, and ready to publish.`;

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 6000,
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

    const result: ContentResult = JSON.parse(fullResponse);
    sendSSE(res, { type: "result", data: result });
    await logAiUsage({ clerkUserId, action: `Content created: ${params.topic}`, module: "content" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    sendSSEError(res, msg);
    return;
  }

  sendSSEDone(res);
}
