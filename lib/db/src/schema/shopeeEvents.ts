import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const shopeeEvents = pgTable("shopee_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type"),
  shopId: text("shop_id"),
  payload: jsonb("payload"),
  receivedAt: timestamp("received_at").defaultNow(),
});

export type ShopeeEvent = typeof shopeeEvents.$inferSelect;
