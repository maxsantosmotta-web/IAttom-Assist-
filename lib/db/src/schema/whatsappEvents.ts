import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const whatsappEvents = pgTable("whatsapp_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type"),
  fromNumber: text("from_number"),
  payload: jsonb("payload"),
  receivedAt: timestamp("received_at").defaultNow(),
});

export type WhatsAppEvent = typeof whatsappEvents.$inferSelect;
