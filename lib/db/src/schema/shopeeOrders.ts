import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const shopeeOrders = pgTable("shopee_orders", {
  id: serial("id").primaryKey(),
  orderSn: text("order_sn").notNull().unique(),
  status: text("status").default(""),
  totalPrice: text("total_price").default("0"),
  buyerUsername: text("buyer_username").default(""),
  createTime: timestamp("create_time"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type ShopeeOrder = typeof shopeeOrders.$inferSelect;
