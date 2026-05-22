import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const userHotmartProductClaims = pgTable(
  "user_hotmart_product_claims",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    productId: text("product_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("user_hotmart_product_claims_unique").on(table.clerkUserId, table.productId),
  ],
);

export type UserHotmartProductClaim = typeof userHotmartProductClaims.$inferSelect;
export type NewUserHotmartProductClaim = typeof userHotmartProductClaims.$inferInsert;
