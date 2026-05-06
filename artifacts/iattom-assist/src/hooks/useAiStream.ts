import { useState, useCallback, useRef } from "react";

export type AiStreamStatus = "idle" | "generating" | "done" | "error";

export interface AiStreamState<T> {
  status: AiStreamStatus;
  result: T | null;
  error: string | null;
  tokenCount: number;
}

export function useAiStream<T = unknown>() {
  const [state, setState] = useState<AiStreamState<T>>({
    status: "idle",
    result: null,
    error: null,
    tokenCount: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (endpoint: string, body: Record<string, unknown>): Promise<T | null> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ status: "generating", result: null, error: null, tokenCount: 0 });

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
          credentials: "include",
        });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errorBody?.error ?? `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let resultData: T | null = null;
        let tokenCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const event = JSON.parse(raw) as {
                type: string;
                content?: string;
                data?: T;
                message?: string;
              };

              if (event.type === "chunk" && event.content) {
                tokenCount += event.content.length;
                setState((s) => ({ ...s, tokenCount }));
              } else if (event.type === "result" && event.data) {
                resultData = event.data;
                setState((s) => ({ ...s, result: resultData }));
              } else if (event.type === "error") {
                throw new Error(event.message ?? "Generation failed");
              } else if (event.type === "done") {
                setState((s) => ({ ...s, status: "done" }));
                return resultData;
              }
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) continue;
              throw parseErr;
            }
          }
        }

        setState((s) => ({ ...s, status: "done" }));
        return resultData;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setState((s) => ({ ...s, status: "idle" }));
          return null;
        }
        const msg = err instanceof Error ? err.message : "Generation failed";
        setState({ status: "error", result: null, error: msg, tokenCount: 0 });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle", result: null, error: null, tokenCount: 0 });
  }, []);

  return { ...state, generate, reset };
}
