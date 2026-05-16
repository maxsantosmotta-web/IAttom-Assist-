import { db } from "@workspace/db";
import {
  userMetaConnections,
  userWhatsappConnections,
  userHotmartConnections,
  userKiwifyConnections,
  userShopeeConnections,
  userMlConnections,
  userTiktokConnections,
  type UserMetaConnection,
  type UserWhatsappConnection,
  type UserHotmartConnection,
  type UserKiwifyConnection,
  type UserShopeeConnection,
  type UserMlConnection,
  type UserTiktokConnection,
  type NewUserMetaConnection,
  type NewUserWhatsappConnection,
  type NewUserHotmartConnection,
  type NewUserKiwifyConnection,
  type NewUserShopeeConnection,
  type NewUserMlConnection,
  type NewUserTiktokConnection,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

export type Platform =
  | "meta"
  | "whatsapp"
  | "hotmart"
  | "kiwify"
  | "shopee"
  | "ml"
  | "tiktok";

export type UserConnectionByPlatform = {
  meta: UserMetaConnection;
  whatsapp: UserWhatsappConnection;
  hotmart: UserHotmartConnection;
  kiwify: UserKiwifyConnection;
  shopee: UserShopeeConnection;
  ml: UserMlConnection;
  tiktok: UserTiktokConnection;
};

export type NewUserConnectionByPlatform = {
  meta: NewUserMetaConnection;
  whatsapp: NewUserWhatsappConnection;
  hotmart: NewUserHotmartConnection;
  kiwify: NewUserKiwifyConnection;
  shopee: NewUserShopeeConnection;
  ml: NewUserMlConnection;
  tiktok: NewUserTiktokConnection;
};

async function getCurrentUserConnection(clerkUserId: string, platform: "meta"): Promise<UserMetaConnection | null>;
async function getCurrentUserConnection(clerkUserId: string, platform: "whatsapp"): Promise<UserWhatsappConnection | null>;
async function getCurrentUserConnection(clerkUserId: string, platform: "hotmart"): Promise<UserHotmartConnection | null>;
async function getCurrentUserConnection(clerkUserId: string, platform: "kiwify"): Promise<UserKiwifyConnection | null>;
async function getCurrentUserConnection(clerkUserId: string, platform: "shopee"): Promise<UserShopeeConnection | null>;
async function getCurrentUserConnection(clerkUserId: string, platform: "ml"): Promise<UserMlConnection | null>;
async function getCurrentUserConnection(clerkUserId: string, platform: "tiktok"): Promise<UserTiktokConnection | null>;
async function getCurrentUserConnection(
  clerkUserId: string,
  platform: Platform,
): Promise<UserConnectionByPlatform[Platform] | null> {
  switch (platform) {
    case "meta": {
      const [row] = await db.select().from(userMetaConnections)
        .where(and(eq(userMetaConnections.clerkUserId, clerkUserId), eq(userMetaConnections.isActive, true)))
        .limit(1);
      return row ?? null;
    }
    case "whatsapp": {
      const [row] = await db.select().from(userWhatsappConnections)
        .where(and(eq(userWhatsappConnections.clerkUserId, clerkUserId), eq(userWhatsappConnections.isActive, true)))
        .limit(1);
      return row ?? null;
    }
    case "hotmart": {
      const [row] = await db.select().from(userHotmartConnections)
        .where(and(eq(userHotmartConnections.clerkUserId, clerkUserId), eq(userHotmartConnections.isActive, true)))
        .limit(1);
      return row ?? null;
    }
    case "kiwify": {
      const [row] = await db.select().from(userKiwifyConnections)
        .where(and(eq(userKiwifyConnections.clerkUserId, clerkUserId), eq(userKiwifyConnections.isActive, true)))
        .limit(1);
      return row ?? null;
    }
    case "shopee": {
      const [row] = await db.select().from(userShopeeConnections)
        .where(and(eq(userShopeeConnections.clerkUserId, clerkUserId), eq(userShopeeConnections.isActive, true)))
        .limit(1);
      return row ?? null;
    }
    case "ml": {
      const [row] = await db.select().from(userMlConnections)
        .where(and(eq(userMlConnections.clerkUserId, clerkUserId), eq(userMlConnections.isActive, true)))
        .limit(1);
      return row ?? null;
    }
    case "tiktok": {
      const [row] = await db.select().from(userTiktokConnections)
        .where(and(eq(userTiktokConnections.clerkUserId, clerkUserId), eq(userTiktokConnections.isActive, true)))
        .limit(1);
      return row ?? null;
    }
  }
}

export { getCurrentUserConnection };

export async function getAllUserConnections(clerkUserId: string): Promise<{
  meta: UserMetaConnection[];
  whatsapp: UserWhatsappConnection[];
  hotmart: UserHotmartConnection[];
  kiwify: UserKiwifyConnection[];
  shopee: UserShopeeConnection[];
  ml: UserMlConnection[];
  tiktok: UserTiktokConnection[];
}> {
  const [meta, whatsapp, hotmart, kiwify, shopee, ml, tiktok] = await Promise.all([
    db.select().from(userMetaConnections).where(and(eq(userMetaConnections.clerkUserId, clerkUserId), eq(userMetaConnections.isActive, true))),
    db.select().from(userWhatsappConnections).where(and(eq(userWhatsappConnections.clerkUserId, clerkUserId), eq(userWhatsappConnections.isActive, true))),
    db.select().from(userHotmartConnections).where(and(eq(userHotmartConnections.clerkUserId, clerkUserId), eq(userHotmartConnections.isActive, true))),
    db.select().from(userKiwifyConnections).where(and(eq(userKiwifyConnections.clerkUserId, clerkUserId), eq(userKiwifyConnections.isActive, true))),
    db.select().from(userShopeeConnections).where(and(eq(userShopeeConnections.clerkUserId, clerkUserId), eq(userShopeeConnections.isActive, true))),
    db.select().from(userMlConnections).where(and(eq(userMlConnections.clerkUserId, clerkUserId), eq(userMlConnections.isActive, true))),
    db.select().from(userTiktokConnections).where(and(eq(userTiktokConnections.clerkUserId, clerkUserId), eq(userTiktokConnections.isActive, true))),
  ]);
  return { meta, whatsapp, hotmart, kiwify, shopee, ml, tiktok };
}

export async function upsertUserConnection<P extends Platform>(
  clerkUserId: string,
  platform: P,
  data: Omit<NewUserConnectionByPlatform[P], "clerkUserId">,
): Promise<void> {
  switch (platform) {
    case "meta":
      await db.insert(userMetaConnections).values({ clerkUserId, ...(data as Omit<NewUserMetaConnection, "clerkUserId">) });
      break;
    case "whatsapp":
      await db.insert(userWhatsappConnections).values({ clerkUserId, ...(data as Omit<NewUserWhatsappConnection, "clerkUserId">) });
      break;
    case "hotmart":
      await db.insert(userHotmartConnections).values({ clerkUserId, ...(data as Omit<NewUserHotmartConnection, "clerkUserId">) });
      break;
    case "kiwify":
      await db.insert(userKiwifyConnections).values({ clerkUserId, ...(data as Omit<NewUserKiwifyConnection, "clerkUserId">) });
      break;
    case "shopee":
      await db.insert(userShopeeConnections).values({ clerkUserId, ...(data as Omit<NewUserShopeeConnection, "clerkUserId">) });
      break;
    case "ml":
      await db.insert(userMlConnections).values({ clerkUserId, ...(data as Omit<NewUserMlConnection, "clerkUserId">) });
      break;
    case "tiktok":
      await db.insert(userTiktokConnections).values({ clerkUserId, ...(data as Omit<NewUserTiktokConnection, "clerkUserId">) });
      break;
  }
}

export async function deactivateUserConnection(clerkUserId: string, platform: Platform, connectionId: number): Promise<void> {
  switch (platform) {
    case "meta":
      await db.update(userMetaConnections).set({ isActive: false, updatedAt: new Date() }).where(and(eq(userMetaConnections.id, connectionId), eq(userMetaConnections.clerkUserId, clerkUserId)));
      break;
    case "whatsapp":
      await db.update(userWhatsappConnections).set({ isActive: false, updatedAt: new Date() }).where(and(eq(userWhatsappConnections.id, connectionId), eq(userWhatsappConnections.clerkUserId, clerkUserId)));
      break;
    case "hotmart":
      await db.update(userHotmartConnections).set({ isActive: false, updatedAt: new Date() }).where(and(eq(userHotmartConnections.id, connectionId), eq(userHotmartConnections.clerkUserId, clerkUserId)));
      break;
    case "kiwify":
      await db.update(userKiwifyConnections).set({ isActive: false, updatedAt: new Date() }).where(and(eq(userKiwifyConnections.id, connectionId), eq(userKiwifyConnections.clerkUserId, clerkUserId)));
      break;
    case "shopee":
      await db.update(userShopeeConnections).set({ isActive: false, updatedAt: new Date() }).where(and(eq(userShopeeConnections.id, connectionId), eq(userShopeeConnections.clerkUserId, clerkUserId)));
      break;
    case "ml":
      await db.update(userMlConnections).set({ isActive: false, updatedAt: new Date() }).where(and(eq(userMlConnections.id, connectionId), eq(userMlConnections.clerkUserId, clerkUserId)));
      break;
    case "tiktok":
      await db.update(userTiktokConnections).set({ isActive: false, updatedAt: new Date() }).where(and(eq(userTiktokConnections.id, connectionId), eq(userTiktokConnections.clerkUserId, clerkUserId)));
      break;
  }
}
