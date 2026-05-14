import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const shopeeProducts = pgTable("shopee_products", {
  id: serial("id").primaryKey(),
  itemId: text("item_id").notNull().unique(),
  name: text("name").default(""),
  price: text("price").default("0"),
  stock: integer("stock").default(0),
  status: text("status").default("NORMAL"),
  category: text("category").default(""),
  imageUrl: text("image_url").default(""),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type ShopeeProduct = typeof shopeeProducts.$inferSelect;
