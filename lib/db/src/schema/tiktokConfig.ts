import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const tiktokConfig = pgTable("tiktok_config", {
  id: serial("id").primaryKey(),
  clientKey: text("client_key").notNull().default(""),
  clientSecret: text("client_secret").notNull().default(""),
  redirectUri: text("redirect_uri").default(""),
  environment: text("environment").notNull().default("sandbox"),
  isActive: boolean("is_active").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type TikTokConfig = typeof tiktokConfig.$inferSelect;
export type NewTikTokConfig = typeof tiktokConfig.$inferInsert;
