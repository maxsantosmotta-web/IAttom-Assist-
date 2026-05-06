import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const referralUsesTable = pgTable("referral_uses", {
  id: serial("id").primaryKey(),
  referralCode: text("referral_code").notNull(),
  referrerUserId: text("referrer_user_id").notNull(),
  referredUserId: text("referred_user_id").notNull().unique(),
  creditsAwarded: integer("credits_awarded").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReferralUse = typeof referralUsesTable.$inferSelect;
