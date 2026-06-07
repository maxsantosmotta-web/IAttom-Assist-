import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const tiktokEvents = pgTable("tiktok_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type"),
  userId: text("user_id"),
  payload: jsonb("payload"),
  receivedAt: timestamp("received_at").defaultNow(),
});

export type TiktokEvent = typeof tiktokEvents.$inferSelect;
