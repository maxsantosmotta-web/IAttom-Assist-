import { getCurrentUserConnection, upsertUserConnection, deactivateUserConnection } from "../userConnectionsService.js";
import type { UserMetaConnection, NewUserMetaConnection } from "@workspace/db";

export async function getMetaConnection(clerkUserId: string): Promise<UserMetaConnection | null> {
  return getCurrentUserConnection(clerkUserId, "meta");
}

export async function saveMetaConnection(
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
  await upsertUserConnection(clerkUserId, "meta", {
    platformUserId: data.platformUserId,
    platformUsername: data.platformUsername ?? "",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? "",
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes ?? "",
    metadata: data.metadata ?? {},
    isActive: true,
  } satisfies Omit<NewUserMetaConnection, "clerkUserId">);
}

export async function disconnectMeta(clerkUserId: string, connectionId: number): Promise<void> {
  await deactivateUserConnection(clerkUserId, "meta", connectionId);
}

export async function refreshMetaToken(_clerkUserId: string, _connectionId: number): Promise<void> {
  // TODO — Phase 2: implement Meta token refresh via Graph API
  throw new Error("Meta token refresh not yet implemented.");
}
