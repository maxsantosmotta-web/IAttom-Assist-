import { eq, count } from "drizzle-orm";
import { db, users, creditsTransactions } from "@workspace/db";

export const FEATURE_COSTS = {
  product_discovery: 5,
  product_validation: 5,
  campaign: 10,
  content: 8,
  creative: 15,
  video_script: 10,
} as const;

export const PLAN_CREDITS = {
  free: 50,
  pro: 500,
  business: 2000,
  agency: 10000,
} as const;

export type FeatureKey = keyof typeof FEATURE_COSTS;
export type PlanKey = keyof typeof PLAN_CREDITS;

export async function getUserWithCredits(clerkId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
  return user ?? null;
}

export async function deductCredits(clerkId: string, feature: FeatureKey) {
  const cost = FEATURE_COSTS[feature];
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));

  if (!user) return { success: false as const, error: "user_not_found" as const };

  if (user.role === "admin") {
    const [tx] = await db
      .insert(creditsTransactions)
      .values({
        clerkUserId: clerkId,
        amount: 0,
        type: "debit" as const,
        feature,
        description: `[ADMIN] ${feature.replace(/_/g, " ")} — sem cobrança`,
        balanceBefore: user.credits,
        balanceAfter: user.credits,
      })
      .returning();

    return {
      success: true as const,
      creditsUsed: 0,
      newBalance: user.credits,
      transactionId: tx.id,
      user,
    };
  }

  if (user.credits < cost) {
    return {
      success: false as const,
      error: "insufficient_credits" as const,
      balance: user.credits,
      required: cost,
    };
  }

  const balanceBefore = user.credits;
  const balanceAfter = balanceBefore - cost;

  const [updated] = await db
    .update(users)
    .set({ credits: balanceAfter, updatedAt: new Date() })
    .where(eq(users.clerkId, clerkId))
    .returning();

  const [tx] = await db
    .insert(creditsTransactions)
    .values({
      clerkUserId: clerkId,
      amount: -cost,
      type: "debit",
      feature,
      description: `Used ${feature.replace(/_/g, " ")} feature`,
      balanceBefore,
      balanceAfter,
    })
    .returning();

  return {
    success: true as const,
    creditsUsed: cost,
    newBalance: balanceAfter,
    transactionId: tx.id,
    user: updated,
  };
}

export async function adjustCredits(
  clerkId: string,
  amount: number,
  description: string,
  type: "credit" | "adjustment" | "initial" | "refund" = "adjustment",
) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
  if (!user) return null;

  const balanceBefore = user.credits;
  const balanceAfter = Math.max(0, balanceBefore + amount);

  const [updated] = await db
    .update(users)
    .set({ credits: balanceAfter, updatedAt: new Date() })
    .where(eq(users.clerkId, clerkId))
    .returning();

  const [tx] = await db
    .insert(creditsTransactions)
    .values({
      clerkUserId: clerkId,
      amount,
      type,
      description,
      balanceBefore,
      balanceAfter,
    })
    .returning();

  return { user: updated, transaction: tx };
}

export async function getTransactionCount(clerkUserId: string) {
  const [res] = await db
    .select({ count: count() })
    .from(creditsTransactions)
    .where(eq(creditsTransactions.clerkUserId, clerkUserId));
  return res?.count ?? 0;
}
