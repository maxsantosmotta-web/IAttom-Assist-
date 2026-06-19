import { eq, count } from "drizzle-orm";
import {
  creditsTransactions,
  db,
  emailVerifications,
  feedbackTable,
  helpMessages,
  historyTable,
  mlProducts,
  notificationsTable,
  projectsTable,
  referralsTable,
  savedItemsTable,
  savedPromptsTable,
  trashItems,
  userHotmartConnections,
  userHotmartProductClaims,
  userKiwifyConnections,
  userMetaConnections,
  userMlConnections,
  userShopeeConnections,
  userTiktokConnections,
  users,
  videoTransactions,
} from "@workspace/db";
import { clerkClient } from "@clerk/express";

// Returns true if this user should receive automatic admin + full access.
// Two triggers:
//   1. ADMIN_EMAIL env var matches (case-insensitive) — works even after other users exist.
//   2. The database currently has zero users (first-ever sign-up).
async function shouldAutoPromote(email: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && email.toLowerCase() === adminEmail) return true;

  // count() returns a string from PostgreSQL bigint — use Number() for safe comparison.
  const [{ value }] = await db.select({ value: count() }).from(users);
  return Number(value) === 0;
}

async function claimUserAndReassignClerkOwnedRecords(params: {
  email: string;
  oldClerkId: string;
  newClerkId: string;
  name?: string | null;
}) {
  const { email, oldClerkId, newClerkId, name } = params;

  if (oldClerkId === newClerkId) return;

  return db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(users)
      .set({ clerkId: newClerkId, name, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();

    await Promise.all([
      tx.update(projectsTable).set({ clerkUserId: newClerkId }).where(eq(projectsTable.clerkUserId, oldClerkId)),
      tx.update(historyTable).set({ clerkUserId: newClerkId }).where(eq(historyTable.clerkUserId, oldClerkId)),
      tx.update(creditsTransactions).set({ clerkUserId: newClerkId }).where(eq(creditsTransactions.clerkUserId, oldClerkId)),
      tx.update(feedbackTable).set({ clerkUserId: newClerkId }).where(eq(feedbackTable.clerkUserId, oldClerkId)),
      tx.update(notificationsTable).set({ clerkUserId: newClerkId }).where(eq(notificationsTable.clerkUserId, oldClerkId)),
      tx.update(savedPromptsTable).set({ clerkUserId: newClerkId }).where(eq(savedPromptsTable.clerkUserId, oldClerkId)),
      tx.update(referralsTable).set({ clerkUserId: newClerkId }).where(eq(referralsTable.clerkUserId, oldClerkId)),
      tx.update(mlProducts).set({ clerkUserId: newClerkId }).where(eq(mlProducts.clerkUserId, oldClerkId)),
      tx.update(trashItems).set({ clerkUserId: newClerkId }).where(eq(trashItems.clerkUserId, oldClerkId)),
      tx.update(userMetaConnections).set({ clerkUserId: newClerkId }).where(eq(userMetaConnections.clerkUserId, oldClerkId)),
      tx.update(userHotmartConnections).set({ clerkUserId: newClerkId }).where(eq(userHotmartConnections.clerkUserId, oldClerkId)),
      tx.update(userHotmartProductClaims).set({ clerkUserId: newClerkId }).where(eq(userHotmartProductClaims.clerkUserId, oldClerkId)),
      tx.update(userKiwifyConnections).set({ clerkUserId: newClerkId }).where(eq(userKiwifyConnections.clerkUserId, oldClerkId)),
      tx.update(userShopeeConnections).set({ clerkUserId: newClerkId }).where(eq(userShopeeConnections.clerkUserId, oldClerkId)),
      tx.update(userMlConnections).set({ clerkUserId: newClerkId }).where(eq(userMlConnections.clerkUserId, oldClerkId)),
      tx.update(userTiktokConnections).set({ clerkUserId: newClerkId }).where(eq(userTiktokConnections.clerkUserId, oldClerkId)),
      tx.update(savedItemsTable).set({ clerkUserId: newClerkId }).where(eq(savedItemsTable.clerkUserId, oldClerkId)),
      tx.update(helpMessages).set({ clerkUserId: newClerkId }).where(eq(helpMessages.clerkUserId, oldClerkId)),
      tx.update(videoTransactions).set({ clerkUserId: newClerkId }).where(eq(videoTransactions.clerkUserId, oldClerkId)),
      tx.update(emailVerifications).set({ clerkUserId: newClerkId }).where(eq(emailVerifications.clerkUserId, oldClerkId)),
    ]);

    return claimed;
  });
}

export async function getOrSyncUser(clerkId: string, email?: string, name?: string) {
  // If a stub record was pre-created by email (no Clerk ID yet), claim it now.
  if (email) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (byEmail && byEmail.clerkId !== clerkId) {
      // Claim the pre-seeded stub and attach the real Clerk ID.
      return claimUserAndReassignClerkOwnedRecords({
        email,
        oldClerkId: byEmail.clerkId,
        newClerkId: clerkId,
        name: name ?? byEmail.name,
      });
    }
  }

  const [existing] = await db.select().from(users).where(eq(users.clerkId, clerkId));

  if (existing) {
    // If the user exists but hasn't been promoted yet, check if they qualify.
    if (email && existing.role !== "admin") {
      const promote = await shouldAutoPromote(email);
      if (promote) {
        const [updated] = await db
          .update(users)
          .set({ role: "admin", betaAccess: true, plan: "pro", credits: 500, registrationConfirmed: true, updatedAt: new Date() })
          .where(eq(users.clerkId, clerkId))
          .returning();
        return updated;
      }
    }
    return existing;
  }

  if (!email) return null;

  const promote = await shouldAutoPromote(email);

  const [created] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      name: name ?? null,
      ...(promote
        ? { role: "admin" as const, betaAccess: true, plan: "pro" as const, credits: 500, registrationConfirmed: true }
        : {}),
    })
    .returning();
  return created;
}

export async function getAdminCount() {
  const [result] = await db.select({ count: count() }).from(users).where(eq(users.role, "admin"));
  return Number(result.count);
}

/**
 * Garante que qualquer usuário autenticado pelo Clerk tenha registro no DB.
 * Busca email/name direto da API do Clerk e chama getOrSyncUser.
 * Usado por /auth/me e /credits/balance para eliminar usuários fantasma.
 */
export async function getOrCreateUserFromClerk(clerkUserId: string) {
  // Fast-path: usuário já existe — não chama API do Clerk
  const [existing] = await db.select().from(users).where(eq(users.clerkId, clerkUserId));
  if (existing) return existing;

  // Não existe no DB — buscar dados no Clerk para criar
  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || undefined;

  if (!email) return null;

  return getOrSyncUser(clerkUserId, email, name);
}
