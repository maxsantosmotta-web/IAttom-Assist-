import { useEffect, useRef } from "react";

const PERSIST_VERSION = "v1";

function buildKey(module: string): string {
  return `iattom_persist_${module}_${PERSIST_VERSION}`;
}

export function saveModuleState<T>(module: string, state: T): void {
  try {
    localStorage.setItem(buildKey(module), JSON.stringify({ state, savedAt: new Date().toISOString() }));
  } catch {}
}

export function loadModuleState<T>(module: string): T | null {
  try {
    const raw = localStorage.getItem(buildKey(module));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state: T };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export function clearModuleState(module: string): void {
  try {
    localStorage.removeItem(buildKey(module));
  } catch {}
}

export function useAutoSaveModule<T>(
  module: string,
  status: string,
  result: T | null,
  formState: Record<string, unknown>,
): void {
  const savedRef = useRef(false);

  useEffect(() => {
    if (status === "done" && result !== null) {
      if (!savedRef.current) {
        savedRef.current = true;
        saveModuleState(module, { form: formState, result });
      }
    }
    if (status === "idle" || status === "generating") {
      savedRef.current = false;
    }
  });
}
