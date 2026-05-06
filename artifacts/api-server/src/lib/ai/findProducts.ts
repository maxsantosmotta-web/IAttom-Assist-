import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";

interface FindProductsInput {
  query: string;
  niche?: string;
  priceRange?: string;
  targetMarket?: string;
}
import { logAiUsage } from "./logger.js";

export interface FoundProduct {
  name: string;
  category: string;
  score: number;
  demand: string;
  margin: string;
  trend: string;
  whyNow: string;
  targetAudience: string;
  keySellingPoints: string[];
  competition: string;
  estimatedMonthlyRevenue: string;
}

export interface FindProductsResult {
  products: FoundProduct[];
  marketInsight: string;
  topPick: string;
}

export async function streamFindProducts(
  params: FindProductsInput,
  res: Response,
  clerkUserId: string,
): Promise<void> {
  setupSSE(res);
  sendSSE(res, { type: "start" });

  const systemPrompt = `You are an elite e-commerce product researcher and market analyst with deep expertise in identifying high-margin, trending products. You analyze market data, consumer trends, and competitive landscapes to surface winning opportunities.

Your output must be a valid JSON object — no markdown, no code blocks, just raw JSON.

Return this exact structure:
{
  "products": [
    {
      "name": string,
      "category": string,
      "score": number (0-100, overall opportunity score),
      "demand": "Very High" | "High" | "Medium" | "Low",
      "margin": string (e.g. "68%"),
      "trend": string (e.g. "+34%"),
      "whyNow": string (1-2 sentences on why this is timely),
      "targetAudience": string,
      "keySellingPoints": string[] (3 points),
      "competition": "Very High" | "High" | "Medium" | "Low",
      "estimatedMonthlyRevenue": string (e.g. "$15,000-$45,000")
    }
  ],
  "marketInsight": string (2-3 sentences of expert market commentary),
  "topPick": string (name of the single best opportunity)
}

Return 5-6 products. Make every product recommendation feel premium, specific, and data-driven.`;

  const userPrompt = `Find winning e-commerce products for: "${params.query}"
${params.niche ? `Niche focus: ${params.niche}` : ""}
${params.priceRange ? `Price range: ${params.priceRange}` : ""}
${params.targetMarket ? `Target market: ${params.targetMarket}` : ""}

Return a JSON response with 5-6 specific, actionable product recommendations with real market data.`;

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

    const result: FindProductsResult = JSON.parse(fullResponse);
    sendSSE(res, { type: "result", data: result });
    await logAiUsage({ clerkUserId, action: "AI product discovery", module: "find_products" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    sendSSEError(res, msg);
    return;
  }

  sendSSEDone(res);
}
