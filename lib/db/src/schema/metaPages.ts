import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const metaPages = pgTable("meta_pages", {
  id: serial("id").primaryKey(),
  pageId: text("page_id").notNull().unique(),
  name: text("name").notNull().default(""),
  category: text("category").default(""),
  accessToken: text("access_token").notNull().default(""),
  instagramAccountId: text("instagram_account_id"),
  webhookSubscribed: boolean("webhook_subscribed").default(false),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type MetaPage = typeof metaPages.$inferSelect;
export type NewMetaPage = typeof metaPages.$inferInsert;
