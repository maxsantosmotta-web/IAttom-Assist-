import { getCurrentUserConnection, upsertUserConnection, deactivateUserConnection } from "../userConnectionsService.js";
import type { UserTiktokConnection, NewUserTiktokConnection } from "@workspace/db";

export async function getTiktokConnection(clerkUserId: string): Promise<UserTiktokConnection | null> {
  return getCurrentUserConnection(clerkUserId, "tiktok");
}

export async function saveTiktokConnection(
  clerkUserId: string,
  data: {
    platformUserId: string;
    platformUsername?: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scopes?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await upsertUserConnection(clerkUserId, "tiktok", {
    platformUserId: data.platformUserId,
    platformUsername: data.platformUsername ?? "",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? "",
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes ?? "",
    metadata: data.metadata ?? {},
    isActive: true,
  } satisfies Omit<NewUserTiktokConnection, "clerkUserId">);
}

export async function disconnectTiktok(clerkUserId: string, connectionId: number): Promise<void> {
  await deactivateUserConnection(clerkUserId, "tiktok", connectionId);
}

export async function refreshTiktokToken(_clerkUserId: string, _connectionId: number): Promise<void> {
  // TODO — Phase 2: TikTok for Business OAuth2 — POST /v2/oauth/token/ with refresh_token grant
  throw new Error("TikTok token refresh not yet implemented.");
}
