import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const metaEvents = pgTable("meta_events", {
  id: serial("id").primaryKey(),
  platform: text("platform"),       // "facebook" | "instagram"
  eventType: text("event_type"),    // "messages" | "comments" | "feed" | etc.
  objectId: text("object_id"),
  payload: jsonb("payload"),
  receivedAt: timestamp("received_at").defaultNow(),
});

export type MetaEvent = typeof metaEvents.$inferSelect;
