import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const mlEvents = pgTable("ml_events", {
  id: serial("id").primaryKey(),
  topic: text("topic"),
  resource: text("resource"),
  userId: text("user_id"),
  payload: jsonb("payload"),
  receivedAt: timestamp("received_at").defaultNow(),
});

export type MLEvent = typeof mlEvents.$inferSelect;
