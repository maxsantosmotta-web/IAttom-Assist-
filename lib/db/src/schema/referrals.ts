import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  code: text("code").notNull().unique(),
  totalUses: integer("total_uses").notNull().default(0),
  creditsEarned: integer("credits_earned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
