import { eq, count } from "drizzle-orm";
import { db, users } from "@workspace/db";

export async function getOrSyncUser(clerkId: string, email?: string, name?: string) {
  const [existing] = await db.select().from(users).where(eq(users.clerkId, clerkId));
  if (existing) return existing;
  if (!email) return null;
  const [created] = await db
    .insert(users)
    .values({ clerkId, email, name: name ?? null })
    .returning();
  return created;
}

export async function getAdminCount() {
  const [result] = await db.select({ count: count() }).from(users).where(eq(users.role, "admin"));
  return result.count;
}
