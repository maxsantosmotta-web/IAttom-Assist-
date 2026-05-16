import { getCurrentUserConnection, upsertUserConnection, deactivateUserConnection } from "../userConnectionsService.js";
import type { UserShopeeConnection, NewUserShopeeConnection } from "@workspace/db";

export async function getShopeeConnection(clerkUserId: string): Promise<UserShopeeConnection | null> {
  return getCurrentUserConnection(clerkUserId, "shopee");
}

export async function saveShopeeConnection(
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
  await upsertUserConnection(clerkUserId, "shopee", {
    platformUserId: data.platformUserId,
    platformUsername: data.platformUsername ?? "",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? "",
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes ?? "",
    metadata: data.metadata ?? {},
    isActive: true,
  } satisfies Omit<NewUserShopeeConnection, "clerkUserId">);
}

export async function disconnectShopee(clerkUserId: string, connectionId: number): Promise<void> {
  await deactivateUserConnection(clerkUserId, "shopee", connectionId);
}

export async function refreshShopeeToken(_clerkUserId: string, _connectionId: number): Promise<void> {
  // TODO — Phase 2: Shopee access_token refresh via /api/v2/auth/access_token/get
  throw new Error("Shopee token refresh not yet implemented.");
}
