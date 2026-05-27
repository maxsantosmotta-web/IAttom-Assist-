import { useAuth } from "@clerk/react";
import { useCallback } from "react";

export interface SavedItemPayload {
  id: string;
  title: string;
  type: string;
  platform?: string;
  content?: string;
  data?: string;
  hasImages?: boolean;
}

export interface SavedItemRecord extends SavedItemPayload {
  clerkUserId: string;
  createdAt: string;
  deletedAt: string | null;
  expiresAt: string | null;
}

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useSavedItems() {
  const { getToken } = useAuth();

  const getItems = useCallback(async (): Promise<SavedItemRecord[]> => {
    const token = await getToken();
    if (!token) return [];
    return apiFetch<SavedItemRecord[]>("/api/saved-items", token);
  }, [getToken]);

  const saveItem = useCallback(async (payload: SavedItemPayload): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error("Não autenticado");
    await apiFetch<SavedItemRecord>("/api/saved-items", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }, [getToken]);

  const trashItem = useCallback(async (id: string): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error("Não autenticado");
    await apiFetch<{ ok: boolean }>(`/api/saved-items/${id}`, token, { method: "DELETE" });
  }, [getToken]);

  const getTrash = useCallback(async (): Promise<SavedItemRecord[]> => {
    const token = await getToken();
    if (!token) return [];
    return apiFetch<SavedItemRecord[]>("/api/saved-items/trash", token);
  }, [getToken]);

  const restoreItem = useCallback(async (id: string): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error("Não autenticado");
    await apiFetch<{ ok: boolean }>(`/api/saved-items/${id}/restore`, token, { method: "POST" });
  }, [getToken]);

  const permanentDelete = useCallback(async (id: string): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error("Não autenticado");
    await apiFetch<{ ok: boolean }>(`/api/saved-items/${id}/permanent`, token, { method: "DELETE" });
  }, [getToken]);

  return { getItems, saveItem, trashItem, getTrash, restoreItem, permanentDelete };
}
