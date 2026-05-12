import type { Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "./stream.js";

interface ValidateProductInput {
  productName: string;
  description?: string;
  targetMarket?: string;
  pricePoint?: string;
}
import { logAiUsage } from "./logger.js";

export interface ValidationResult {
  score: number;
  verdict: string;
  marketSize: string;
  competition: string;
  buyerIntentScore: number;
  profitabilityRating: string;
  strengths: string[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  launchStrategy: string;
  pricingInsight: string;
  demandTrend: string;
}

export async function streamValidateProduct(
  params: ValidateProductInput,
  res: Response,
  clerkUserId: string,
): Promise<void> {
  setupSSE(res);
  sendSSE(res, { type: "start" });

  const systemPrompt = `You are an elite product validation analyst and market intelligence expert. You perform rigorous, data-driven product validation using market signals, competitive analysis, and consumer psychology insights.

Your output must be a valid JSON object — no markdown, no code blocks, just raw JSON.

Return this exact structure:
{
  "score": number (0-100, overall viability score),
  "verdict": string (e.g. "Strong Market Fit", "Moderate Potential", "High Risk"),
  "marketSize": string (e.g. "$2.4B"),
  "competition": "Very High" | "High" | "Medium" | "Low",
  "buyerIntentScore": number (0-100),
  "profitabilityRating": "Excellent" | "Good" | "Moderate" | "Poor",
  "strengths": string[] (3-4 specific strengths),
  "risks": string[] (2-3 specific risks),
  "opportunities": string[] (2-3 specific opportunities),
  "recommendation": string (2-3 sentences of expert recommendation),
  "launchStrategy": string (2-3 sentences on how to enter this market),
  "pricingInsight": string (specific pricing recommendation),
  "demandTrend": "Accelerating" | "Growing" | "Stable" | "Declining"
}

Be specific, analytical, and brutally honest. Every insight must feel earned and data-backed.`;

  const userPrompt = `Validate this product/business idea:
Product: "${params.productName}"
${params.description ? `Description: ${params.description}` : ""}
${params.targetMarket ? `Target market: ${params.targetMarket}` : ""}
${params.pricePoint ? `Price point: ${params.pricePoint}` : ""}

Provide a rigorous, honest market validation analysis.`;

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

    const result: ValidationResult = JSON.parse(fullResponse);
    sendSSE(res, { type: "result", data: result });
    await logAiUsage({ clerkUserId, action: `Validado: ${params.productName}`, module: "validate_products" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    sendSSEError(res, msg);
    return;
  }

  sendSSEDone(res);
}
