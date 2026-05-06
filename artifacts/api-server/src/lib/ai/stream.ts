import type { Response } from "express";

export function setupSSE(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
}

export function sendSSE(res: Response, data: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function sendSSEError(res: Response, message: string): void {
  res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
  res.end();
}

export function sendSSEDone(res: Response): void {
  res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  res.end();
}
