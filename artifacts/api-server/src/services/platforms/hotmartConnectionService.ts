import { getCurrentUserConnection, upsertUserConnection, deactivateUserConnection } from "../userConnectionsService.js";
import type { UserHotmartConnection, NewUserHotmartConnection } from "@workspace/db";

export async function getHotmartConnection(clerkUserId: string): Promise<UserHotmartConnection | null> {
  return getCurrentUserConnection(clerkUserId, "hotmart");
}

export async function saveHotmartConnection(
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
  await upsertUserConnection(clerkUserId, "hotmart", {
    platformUserId: data.platformUserId,
    platformUsername: data.platformUsername ?? "",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? "",
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes ?? "",
    metadata: data.metadata ?? {},
    isActive: true,
  } satisfies Omit<NewUserHotmartConnection, "clerkUserId">);
}

export async function disconnectHotmart(clerkUserId: string, connectionId: number): Promise<void> {
  await deactivateUserConnection(clerkUserId, "hotmart", connectionId);
}

export async function refreshHotmartToken(_clerkUserId: string, _connectionId: number): Promise<void> {
  // TODO — Phase 2: Hotmart OAuth2 — POST /security/oauth/token with refresh_token grant
  throw new Error("Hotmart token refresh not yet implemented.");
}
