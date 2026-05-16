import { getCurrentUserConnection, upsertUserConnection, deactivateUserConnection } from "../userConnectionsService.js";
import type { UserMlConnection, NewUserMlConnection } from "@workspace/db";

export async function getMlConnection(clerkUserId: string): Promise<UserMlConnection | null> {
  return getCurrentUserConnection(clerkUserId, "ml");
}

export async function saveMlConnection(
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
  await upsertUserConnection(clerkUserId, "ml", {
    platformUserId: data.platformUserId,
    platformUsername: data.platformUsername ?? "",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? "",
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes ?? "",
    metadata: data.metadata ?? {},
    isActive: true,
  } satisfies Omit<NewUserMlConnection, "clerkUserId">);
}

export async function disconnectMl(clerkUserId: string, connectionId: number): Promise<void> {
  await deactivateUserConnection(clerkUserId, "ml", connectionId);
}

export async function refreshMlToken(_clerkUserId: string, _connectionId: number): Promise<void> {
  // TODO — Phase 2: MercadoLivre refresh via POST /oauth/token with grant_type=refresh_token
  throw new Error("MercadoLivre token refresh not yet implemented.");
}
