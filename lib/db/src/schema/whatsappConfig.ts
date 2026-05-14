import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const whatsappConfig = pgTable("whatsapp_config", {
  id: serial("id").primaryKey(),
  businessAccountId: text("business_account_id").notNull().default(""),
  phoneNumberId: text("phone_number_id").notNull().default(""),
  accessToken: text("access_token").notNull().default(""),
  verifyToken: text("verify_token").notNull().default(""),
  webhookUrl: text("webhook_url").default(""),
  isActive: boolean("is_active").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type WhatsAppConfig = typeof whatsappConfig.$inferSelect;
export type NewWhatsAppConfig = typeof whatsappConfig.$inferInsert;
