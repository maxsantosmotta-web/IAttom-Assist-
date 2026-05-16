import { getCurrentUserConnection, upsertUserConnection, deactivateUserConnection } from "../userConnectionsService.js";
import type { UserKiwifyConnection, NewUserKiwifyConnection } from "@workspace/db";

export async function getKiwifyConnection(clerkUserId: string): Promise<UserKiwifyConnection | null> {
  return getCurrentUserConnection(clerkUserId, "kiwify");
}

export async function saveKiwifyConnection(
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
  await upsertUserConnection(clerkUserId, "kiwify", {
    platformUserId: data.platformUserId,
    platformUsername: data.platformUsername ?? "",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? "",
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes ?? "",
    metadata: data.metadata ?? {},
    isActive: true,
  } satisfies Omit<NewUserKiwifyConnection, "clerkUserId">);
}

export async function disconnectKiwify(clerkUserId: string, connectionId: number): Promise<void> {
  await deactivateUserConnection(clerkUserId, "kiwify", connectionId);
}

export async function refreshKiwifyToken(_clerkUserId: string, _connectionId: number): Promise<void> {
  // TODO — Phase 2: Kiwify OAuth2 token refresh
  throw new Error("Kiwify token refresh not yet implemented.");
}
