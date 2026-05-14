import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const metaConfig = pgTable("meta_config", {
  id: serial("id").primaryKey(),
  appId: text("app_id").notNull().default(""),
  appSecret: text("app_secret").notNull().default(""),
  verifyToken: text("verify_token").notNull().default(""),
  userAccessToken: text("user_access_token").notNull().default(""),
  webhookUrl: text("webhook_url").default(""),
  isActive: boolean("is_active").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type MetaConfig = typeof metaConfig.$inferSelect;
export type NewMetaConfig = typeof metaConfig.$inferInsert;
