import { pgTable, serial, text, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const userMlConnections = pgTable(
  "user_ml_connections",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    platformUserId: text("platform_user_id").notNull().default(""),
    platformUsername: text("platform_username").default(""),
    accessToken: text("access_token").notNull().default(""),
    refreshToken: text("refresh_token").default(""),
    expiresAt: timestamp("expires_at"),
    scopes: text("scopes").default(""),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_ml_connections_clerk_user_id_idx").on(table.clerkUserId),
  ],
);

export type UserMlConnection = typeof userMlConnections.$inferSelect;
export type NewUserMlConnection = typeof userMlConnections.$inferInsert;
