import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  mlConfig,
  mlProducts,
  mlOrders,
  mlEvents,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { generateMLOAuthUrl, exchangeMLCode } from "../lib/mercadolivre.js";

const router: IRouter = Router();

// ─── PUBLIC: Receive ML notifications ───────────────────────────────────────
router.post("/ml/notifications", (req, res): void => {
  const payload = req.body as Record<string, unknown>;
  const topic = (payload.topic as string | undefined) ?? "unknown";
  const resource = (payload.resource as string | undefined) ?? "";
  const userId = String((payload.user_id as number | undefined) ?? "");

  req.log.info({ topic, resource, userId }, "ml: notification received");

  db.insert(mlEvents)
    .values({ topic, resource, userId, payload })
    .then(() => {
      res.status(200).json({ status: "ok" });
    })
    .catch((err: unknown) => {
      req.log.error({ err }, "ml: failed to save event");
      res.status(200).json({ status: "ok" });
    });
});

// ─── PUBLIC: OAuth callback ──────────────────────────────────────────────────
router.get("/ml/oauth-callback", async (req, res): Promise<void> => {
  const code = req.query.code as string | undefined;
  if (!code) {
    res.status(400).send("Missing authorization code");
    return;
  }

  const [config] = await db.select().from(mlConfig).limit(1);
  if (!config) {
    res.status(400).send("ML not configured");
    return;
  }

  const tokens = await exchangeMLCode(config.appId, config.clientSecret, config.redirectUri ?? "", code);
  if (tokens.error) {
    req.log.error({ error: tokens.error }, "ml: OAuth code exchange failed");
    res.status(400).json({ error: tokens.error, message: tokens.message });
    return;
  }

  const expiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await db
    .update(mlConfig)
    .set({
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token ?? "",
      userId: String(tokens.user_id ?? ""),
      tokenExpiry: expiry,
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(mlConfig.id, config.id));

  req.log.info({ userId: tokens.user_id }, "ml: OAuth success, tokens saved");
  res.send("<html><body><p>Autorização concluída. Você pode fechar esta janela.</p></body></html>");
});

// ─── ADMIN: Get config ───────────────────────────────────────────────────────
router.get("/ml/config", requireAdmin, async (_req, res): Promise<void> => {
  const [config] = await db.select().from(mlConfig).limit(1);
  if (!config) {
    res.json({ configured: false });
    return;
  }
  res.json({
    configured: true,
    appId: config.appId,
    clientSecret: config.clientSecret ? "••••••••" + config.clientSecret.slice(-4) : "",
    accessToken: config.accessToken ? "••••••••" + config.accessToken.slice(-4) : "",
    userId: config.userId,
    siteId: config.siteId,
    redirectUri: config.redirectUri,
    isActive: config.isActive,
    tokenExpiry: config.tokenExpiry,
    updatedAt: config.updatedAt,
  });
});

// ─── ADMIN: Save config ──────────────────────────────────────────────────────
const configSchema = z.object({
  appId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().min(1),
  siteId: z.string().optional(),
});

router.post("/ml/config", requireAdmin, async (req, res): Promise<void> => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid payload", issues: parsed.error.issues });
    return;
  }
  const { appId, clientSecret, redirectUri, siteId } = parsed.data;
  const [existing] = await db.select().from(mlConfig).limit(1);

  if (existing) {
    await db
      .update(mlConfig)
      .set({ appId, clientSecret, redirectUri, siteId: siteId ?? "MLB", updatedAt: new Date() })
      .where(eq(mlConfig.id, existing.id));
  } else {
    await db.insert(mlConfig).values({ appId, clientSecret, redirectUri, siteId: siteId ?? "MLB" });
  }

  req.log.info({ appId }, "ml: config saved");
  res.json({ ok: true });
});

// ─── ADMIN: Generate OAuth URL ───────────────────────────────────────────────
router.get("/ml/oauth-url", requireAdmin, async (_req, res): Promise<void> => {
  const [config] = await db.select().from(mlConfig).limit(1);
  if (!config?.appId || !config.redirectUri) {
    res.status(400).json({ error: "Salve as credenciais antes de gerar o link OAuth" });
    return;
  }
  const url = generateMLOAuthUrl(config.appId, config.redirectUri);
  res.json({ url });
});

// ─── ADMIN: Sync products ────────────────────────────────────────────────────
router.post("/ml/sync-products", requireAdmin, async (req, res): Promise<void> => {
  const [config] = await db.select().from(mlConfig).limit(1);
  if (!config?.isActive || !config.accessToken) {
    res.status(503).json({ error: "Mercado Livre não autenticado" });
    return;
  }
  // TODO: call getMLProducts() and upsert into mlProducts table
  req.log.info({ userId: config.userId }, "ml: sync-products triggered (placeholder)");
  res.json({ ok: true, synced: 0, message: "Sincronização de produtos não implementada ainda." });
});

// ─── ADMIN: Sync orders ──────────────────────────────────────────────────────
router.post("/ml/sync-orders", requireAdmin, async (req, res): Promise<void> => {
  const [config] = await db.select().from(mlConfig).limit(1);
  if (!config?.isActive || !config.accessToken) {
    res.status(503).json({ error: "Mercado Livre não autenticado" });
    return;
  }
  // TODO: call getMLOrders() and upsert into mlOrders table
  req.log.info({ userId: config.userId }, "ml: sync-orders triggered (placeholder)");
  res.json({ ok: true, synced: 0, message: "Sincronização de pedidos não implementada ainda." });
});

// ─── ADMIN: List products ────────────────────────────────────────────────────
router.get("/ml/products", requireAdmin, async (_req, res): Promise<void> => {
  const products = await db.select().from(mlProducts).orderBy(desc(mlProducts.syncedAt)).limit(100);
  res.json(products);
});

// ─── ADMIN: List orders ──────────────────────────────────────────────────────
router.get("/ml/orders", requireAdmin, async (_req, res): Promise<void> => {
  const orders = await db.select().from(mlOrders).orderBy(desc(mlOrders.syncedAt)).limit(100);
  res.json(orders);
});

// ─── ADMIN: List events ──────────────────────────────────────────────────────
router.get("/ml/events", requireAdmin, async (_req, res): Promise<void> => {
  const events = await db.select().from(mlEvents).orderBy(desc(mlEvents.receivedAt)).limit(50);
  res.json(events);
});

export default router;
