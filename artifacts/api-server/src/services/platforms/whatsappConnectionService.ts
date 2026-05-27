// @ts-nocheck — arquivo marcado para exclusão na próxima fase
import { getCurrentUserConnection, upsertUserConnection, deactivateUserConnection } from "../userConnectionsService.js";
import type { UserWhatsappConnection, NewUserWhatsappConnection } from "@workspace/db";

export async function getWhatsappConnection(clerkUserId: string): Promise<UserWhatsappConnection | null> {
  return getCurrentUserConnection(clerkUserId, "whatsapp");
}

export async function saveWhatsappConnection(
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
  await upsertUserConnection(clerkUserId, "whatsapp", {
    platformUserId: data.platformUserId,
    platformUsername: data.platformUsername ?? "",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? "",
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes ?? "",
    metadata: data.metadata ?? {},
    isActive: true,
  } satisfies Omit<NewUserWhatsappConnection, "clerkUserId">);
}

export async function disconnectWhatsapp(clerkUserId: string, connectionId: number): Promise<void> {
  await deactivateUserConnection(clerkUserId, "whatsapp", connectionId);
}

export async function refreshWhatsappToken(_clerkUserId: string, _connectionId: number): Promise<void> {
  // TODO — Phase 2: WhatsApp Cloud API uses long-lived tokens; implement rotation here
  throw new Error("WhatsApp token refresh not yet implemented.");
}
