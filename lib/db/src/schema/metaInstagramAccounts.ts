import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const metaInstagramAccounts = pgTable("meta_instagram_accounts", {
  id: serial("id").primaryKey(),
  igId: text("ig_id").notNull().unique(),
  name: text("name").default(""),
  username: text("username").default(""),
  biography: text("biography").default(""),
  followersCount: text("followers_count").default("0"),
  pageId: text("page_id"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type MetaInstagramAccount = typeof metaInstagramAccounts.$inferSelect;
export type NewMetaInstagramAccount = typeof metaInstagramAccounts.$inferInsert;
