import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectTypeEnum = pgEnum("project_type", [
  "product_discovery",
  "product_validation",
  "campaign",
  "content",
  "creative",
  "video_script",
  "marketing",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "in_progress",
  "completed",
]);

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: projectTypeEnum("type").notNull(),
  status: projectStatusEnum("status").notNull().default("draft"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
