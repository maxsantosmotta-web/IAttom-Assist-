import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const mlOrders = pgTable("ml_orders", {
  id: serial("id").primaryKey(),
  mlOrderId: text("ml_order_id").notNull().unique(),
  status: text("status").default(""),
  totalAmount: text("total_amount").default("0"),
  buyerNickname: text("buyer_nickname").default(""),
  dateCreated: timestamp("date_created"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type MLOrder = typeof mlOrders.$inferSelect;
