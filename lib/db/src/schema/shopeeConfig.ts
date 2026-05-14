import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const shopeeConfig = pgTable("shopee_config", {
  id: serial("id").primaryKey(),
  partnerId: text("partner_id").notNull().default(""),
  partnerKey: text("partner_key").notNull().default(""),
  shopId: text("shop_id").default(""),
  accessToken: text("access_token").default(""),
  refreshToken: text("refresh_token").default(""),
  tokenExpiry: timestamp("token_expiry"),
  redirectUrl: text("redirect_url").default(""),
  isActive: boolean("is_active").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ShopeeConfig = typeof shopeeConfig.$inferSelect;
export type NewShopeeConfig = typeof shopeeConfig.$inferInsert;
