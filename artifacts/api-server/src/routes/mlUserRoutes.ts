import { Router, type IRouter } from "express";
import { eq, desc, isNull, sql, and } from "drizzle-orm";
import {
  db,
  mlConfig,
  mlProducts,
  mlEvents,
  trashItems,
  userMlConnections,
} from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth.js";
import {
  generateMLOAuthUrl,
  getMLItems,
  createMLItem,
  MLApiError,
} from "../lib/mercadolivre.js";

const router: IRouter = Router();

// ─── Helper: get active connection for the authenticated user ─────────────────
async function getUserConnection(clerkUserId: string) {
  const [conn] = await db
    .select()
    .from(userMlConnections)
    .where(
      and(
        eq(userMlConnections.clerkUserId, clerkUserId),
        eq(userMlConnections.isActive, true),
      ),
    )
    .limit(1);
  return conn ?? null;
}

// ─── GET /me/ml/status — per-user connection status ───────────────────────────
router.get("/me/ml/status", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const conn = await getUserConnection(clerkUserId);

  // Read app config from mlConfig only to check if OAuth is set up (appId)
  const [config] = await db
    .select({ appId: mlConfig.appId })
    .from(mlConfig)
    .limit(1);

  res.json({
    connected:    !!conn,
    nickname:     conn?.platformUsername ?? null,
    tokenExpired: conn?.expiresAt ? new Date(conn.expiresAt) < new Date() : false,
    appConfigured: !!(config?.appId),
    siteId:       null,
  });
});

// ─── GET /me/ml/oauth-url — generates OAuth URL with user state ───────────────
router.get("/me/ml/oauth-url", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const [config] = await db.select().from(mlConfig).limit(1);
  if (!config?.appId || !config.redirectUri) {
    res.status(503).json({ error: "Integração ML não configurada pelo administrador." });
    return;
  }
  // Encode clerkUserId in state so the callback knows which user to save tokens for
  const url = generateMLOAuthUrl(config.appId, config.redirectUri, `user:${clerkUserId}`);
  res.json({ url });
});

// ─── GET /me/ml/listings — only this user's synced products ───────────────────
router.get("/me/ml/listings", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const items = await db
    .select()
    .from(mlProducts)
    .where(
      and(
        eq(mlProducts.clerkUserId, clerkUserId),
        isNull(mlProducts.deletedAt),
      ),
    )
    .orderBy(desc(mlProducts.syncedAt))
    .limit(100);
  res.json(items);
});

// ─── GET /me/ml/events — webhook events (platform-level, read-only) ───────────
router.get("/me/ml/events", requireAuth, async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(mlEvents)
    .orderBy(desc(mlEvents.id))
    .limit(30);
  res.json(events);
});

// ─── POST /me/ml/sync — sync using the user's own access token ───────────────
router.post("/me/ml/sync", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const conn = await getUserConnection(clerkUserId);

  if (!conn) {
    res.status(503).json({ error: "Conecte sua conta Mercado Livre antes de continuar." });
    return;
  }
  if (!conn.platformUserId) {
    res.status(503).json({ error: "User ID não disponível. Reconecte sua conta Mercado Livre." });
    return;
  }

  try {
    const items = await getMLItems(conn.accessToken, conn.platformUserId);
    let synced = 0;
    for (const item of items) {
      await db
        .insert(mlProducts)
        .values({
          mlItemId:          item.id,
          title:             item.title             ?? "",
          price:             String(item.price      ?? "0"),
          availableQuantity: item.available_quantity ?? 0,
          status:            item.status            ?? "unknown",
          categoryId:        item.category_id       ?? "",
          permalink:         item.permalink         ?? "",
          clerkUserId,
          syncedAt:          new Date(),
        })
        .onConflictDoUpdate({
          target: mlProducts.mlItemId,
          set: {
            title:             item.title             ?? "",
            price:             String(item.price      ?? "0"),
            availableQuantity: item.available_quantity ?? 0,
            status:            item.status            ?? "unknown",
            clerkUserId,
            syncedAt:          sql`now()`,
          },
        });
      synced++;
    }
    res.json({ ok: true, synced });
  } catch (err) {
    req.log.error({ err }, "me/ml/sync: failed");
    if (err instanceof MLApiError && err.isUnauthorized) {
      res.status(401).json({ error: "Token expirado. Reconecte sua conta Mercado Livre." });
    } else {
      res.status(500).json({ error: err instanceof Error ? err.message : "Falha na sincronização" });
    }
  }
});

// ─── POST /me/ml/listings/:id/trash ──────────────────────────────────────────
router.post("/me/ml/listings/:id/trash", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  // Only allow trashing products owned by this user
  const [product] = await db
    .select()
    .from(mlProducts)
    .where(and(eq(mlProducts.id, id), eq(mlProducts.clerkUserId, clerkUserId)))
    .limit(1);
  if (!product) { res.status(404).json({ error: "Anúncio não encontrado" }); return; }

  await db.update(mlProducts).set({ deletedAt: new Date() }).where(eq(mlProducts.id, id));
  await db.insert(trashItems).values({
    originalId:     id,
    platform:       "mercado_livre",
    itemType:       "listing",
    name:           product.title ?? "Anúncio sem título",
    previousStatus: product.status ?? "active",
    snapshot:       JSON.stringify(product),
    clerkUserId,
    deletedAt:      new Date(),
  });

  res.json({ ok: true });
});

// ─── POST /me/ml/create-listing — use user's own access token ─────────────────
router.post("/me/ml/create-listing", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const conn = await getUserConnection(clerkUserId);

  if (!conn) {
    res.status(503).json({ error: "Conecte sua conta Mercado Livre antes de continuar." });
    return;
  }

  try {
    const body = req.body as { title?: string; price?: number; quantity?: number };
    const item = await createMLItem(conn.accessToken, {
      title:              body.title ?? "Novo Anúncio",
      category_id:        "MLB3530",
      price:              body.price ?? 10,
      currency_id:        "BRL",
      available_quantity: body.quantity ?? 1,
      listing_type_id:    "bronze",
      condition:          "new",
      pictures: [
        { source: "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadolivre/logo__large_plus.png" },
      ],
      attributes: [
        { id: "BRAND", value_name: "Minha Marca"          },
        { id: "MODEL", value_name: body.title ?? "Produto" },
      ],
      shipping: {
        mode:          "not_specified",
        local_pick_up: true,
        free_shipping: false,
      },
    });

    if (item.id) {
      await db
        .insert(mlProducts)
        .values({
          mlItemId:          item.id,
          title:             item.title ?? body.title ?? "Novo Anúncio",
          price:             String(body.price ?? 10),
          availableQuantity: body.quantity ?? 1,
          status:            item.status ?? "active",
          categoryId:        "MLB3530",
          permalink:         item.permalink ?? "",
          clerkUserId,
          syncedAt:          new Date(),
        })
        .onConflictDoUpdate({
          target: mlProducts.mlItemId,
          set: {
            title:      item.title     ?? "",
            status:     item.status    ?? "active",
            permalink:  item.permalink ?? "",
            clerkUserId,
            syncedAt:   sql`now()`,
          },
        });
    }

    res.json({ ok: true, item: { id: item.id, permalink: item.permalink } });
  } catch (err) {
    req.log.error({ err }, "me/ml/create-listing: failed");
    if (err instanceof MLApiError && err.isUnauthorized) {
      res.status(401).json({ error: "Token expirado. Reconecte sua conta Mercado Livre." });
    } else {
      res.status(500).json({ error: err instanceof Error ? err.message : "Falha ao criar anúncio" });
    }
  }
});

// ─── POST /me/ml/disconnect — deactivate only this user's connection ──────────
router.post("/me/ml/disconnect", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  await db
    .update(userMlConnections)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(userMlConnections.clerkUserId, clerkUserId));
  req.log.info({ clerkUserId }, "ml: user disconnected own account");
  res.json({ ok: true });
});

export default router;
