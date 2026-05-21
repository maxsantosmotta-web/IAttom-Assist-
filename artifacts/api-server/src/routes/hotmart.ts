import { Router, type IRouter } from "express";
import { eq, desc, isNull, isNotNull, and } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  hotmartConfig,
  hotmartProducts,
  hotmartEvents,
  userHotmartConnections,
  trashItems,
} from "@workspace/db";
import { requireAdmin, type AdminRequest } from "../middlewares/requireAdmin.js";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth.js";
import {
  verifyHotmartWebhook,
  getHotmartAccessToken,
  getHotmartProducts,
  getHotmartAuthorizationUrl,
  exchangeHotmartCode,
} from "../lib/hotmart.js";

const router: IRouter = Router();

const HOTMART_REDIRECT_URI =
  process.env["HOTMART_REDIRECT_URI"] ??
  "https://iattomassist.com.br/api/hotmart/oauth/callback";

const DASHBOARD_HOTMART_URL =
  process.env["APP_URL"] ?? "https://iattomassist.com.br";

// ─── PUBLIC: Receive Hotmart webhook events ──────────────────────────────────
router.post("/hotmart/webhook", (req, res): void => {
  const payload = req.body as Record<string, unknown>;

  const receivedToken =
    (req.query["hottok"] as string | undefined) ??
    (req.headers["x-hotmart-webhook-token"] as string | undefined);

  db.select()
    .from(hotmartConfig)
    .limit(1)
    .then(([config]) => {
      if (config?.webhookToken && receivedToken) {
        const valid = verifyHotmartWebhook(config.webhookToken, receivedToken);
        if (!valid) {
          req.log.warn("hotmart: webhook token mismatch — storing anyway");
        }
      }

      const event    = payload.event as string | undefined;
      const data     = payload.data as Record<string, unknown> | undefined;
      const purchase = data?.purchase as Record<string, unknown> | undefined;
      const buyer    = data?.buyer as Record<string, unknown> | undefined;
      const product  = data?.product as Record<string, unknown> | undefined;

      req.log.info({ event }, "hotmart: event received");

      return db.insert(hotmartEvents).values({
        eventType:     event ?? "UNKNOWN",
        transactionId: (purchase?.transaction as string | undefined) ?? null,
        productId:     String((product?.id as number | undefined) ?? ""),
        buyerEmail:    (buyer?.email as string | undefined) ?? null,
        buyerName:     (buyer?.name as string | undefined) ?? null,
        value: String(
          (purchase as Record<string, unknown> | undefined)?.price !== undefined
            ? ((purchase?.price as Record<string, unknown>)?.value ?? "")
            : "",
        ),
        currency:
          (((purchase as Record<string, unknown> | undefined)
            ?.price as Record<string, unknown> | undefined)
            ?.currency_code as string | undefined) ?? "BRL",
        payload,
      });
    })
    .then(() => { res.status(200).json({ status: "ok" }); })
    .catch((err: unknown) => {
      req.log.error({ err }, "hotmart: failed to save event");
      res.status(200).json({ status: "ok" });
    });
});

// ─── PUBLIC: OAuth callback — receives auth code from Hotmart ─────────────────
router.get("/hotmart/oauth/callback", async (req, res): Promise<void> => {
  const code  = req.query["code"]  as string | undefined;
  const state = req.query["state"] as string | undefined; // = clerkUserId
  const error = req.query["error"] as string | undefined;

  const frontendBase = `${DASHBOARD_HOTMART_URL}/dashboard/hotmart`;

  if (error || !code || !state) {
    req.log.warn({ error, code: !!code, state }, "hotmart: oauth callback error");
    res.redirect(`${frontendBase}?hotmart_error=${encodeURIComponent(error ?? "missing_code")}`);
    return;
  }

  const [config] = await db.select().from(hotmartConfig).limit(1);
  if (!config?.basicToken) {
    res.redirect(`${frontendBase}?hotmart_error=not_configured`);
    return;
  }

  const tokens = await exchangeHotmartCode(config.basicToken, code, HOTMART_REDIRECT_URI);

  if (tokens.error || !tokens.access_token) {
    req.log.warn({ error: tokens.error }, "hotmart: code exchange failed in callback");
    res.redirect(`${frontendBase}?hotmart_error=${encodeURIComponent(tokens.error ?? "exchange_failed")}`);
    return;
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  const [existing] = await db
    .select()
    .from(userHotmartConnections)
    .where(eq(userHotmartConnections.clerkUserId, state))
    .limit(1);

  if (existing) {
    await db
      .update(userHotmartConnections)
      .set({
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token ?? existing.refreshToken ?? "",
        expiresAt:    expiresAt,
        isActive:     true,
        updatedAt:    new Date(),
      })
      .where(eq(userHotmartConnections.id, existing.id));
  } else {
    await db.insert(userHotmartConnections).values({
      clerkUserId:  state,
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? "",
      expiresAt:    expiresAt,
      isActive:     true,
    });
  }

  req.log.info({ clerkUserId: state }, "hotmart: per-user connection stored via OAuth");
  res.redirect(`${frontendBase}?hotmart_connected=1`);
});

// ─── USER: Start Hotmart OAuth for current user ───────────────────────────────
router.get("/hotmart/user/oauth/start", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthenticatedRequest).clerkUserId;

  const [config] = await db.select().from(hotmartConfig).limit(1);
  if (!config?.clientId || !config?.isActive) {
    res.status(503).json({
      error: "Integração Hotmart não configurada. Solicite ao administrador que configure as credenciais.",
    });
    return;
  }

  const authUrl = getHotmartAuthorizationUrl(config.clientId, HOTMART_REDIRECT_URI, clerkUserId);
  req.log.info({ clerkUserId }, "hotmart: OAuth start — returning authorization URL");
  res.json({ authUrl });
});

// ─── USER: Integration status (per-user) ─────────────────────────────────────
router.get("/hotmart/user/integration-status", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthenticatedRequest).clerkUserId;

  const [config] = await db.select().from(hotmartConfig).limit(1);
  const platformConfigured = !!(config?.clientId && config?.clientSecret && config?.basicToken && config?.isActive);

  const [conn] = await db
    .select()
    .from(userHotmartConnections)
    .where(eq(userHotmartConnections.clerkUserId, clerkUserId))
    .limit(1);

  const isActive = !!(conn?.isActive && conn?.accessToken);
  const isExpired = conn?.expiresAt ? conn.expiresAt < new Date() : false;

  res.json({
    configured:      platformConfigured,
    isActive:        isActive && !isExpired,
    platformUsername: conn?.platformUsername ?? null,
    connectedAt:     conn?.createdAt ?? null,
    expiresAt:       conn?.expiresAt ?? null,
    tokenExpired:    isExpired,
  });
});

// ─── USER: Disconnect Hotmart (per-user only) ─────────────────────────────────
router.post("/hotmart/user/disconnect", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthenticatedRequest).clerkUserId;

  const [conn] = await db
    .select()
    .from(userHotmartConnections)
    .where(eq(userHotmartConnections.clerkUserId, clerkUserId))
    .limit(1);

  if (conn) {
    await db
      .update(userHotmartConnections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(userHotmartConnections.id, conn.id));
  }

  req.log.info({ clerkUserId }, "hotmart: user disconnected (per-user)");
  res.json({ ok: true });
});

// ─── USER: Reconnect — re-activate existing connection if tokens present ──────
router.post("/hotmart/user/reconnect", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthenticatedRequest).clerkUserId;

  const [conn] = await db
    .select()
    .from(userHotmartConnections)
    .where(eq(userHotmartConnections.clerkUserId, clerkUserId))
    .limit(1);

  if (!conn?.accessToken) {
    res.status(400).json({
      error: "Nenhuma conexão Hotmart encontrada. Utilize o botão Conectar para iniciar o fluxo de autorização.",
      needsOAuth: true,
    });
    return;
  }

  await db
    .update(userHotmartConnections)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(userHotmartConnections.id, conn.id));

  req.log.info({ clerkUserId }, "hotmart: user reconnected (per-user)");
  res.json({ ok: true });
});

// ─── USER: List products — gated on per-user connection ───────────────────────
router.get("/hotmart/user/products", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthenticatedRequest).clerkUserId;

  const [conn] = await db
    .select()
    .from(userHotmartConnections)
    .where(eq(userHotmartConnections.clerkUserId, clerkUserId))
    .limit(1);

  if (!conn?.isActive || !conn?.accessToken) {
    res.json([]);
    return;
  }

  const products = await db
    .select()
    .from(hotmartProducts)
    .where(isNull(hotmartProducts.deletedAt))
    .orderBy(desc(hotmartProducts.syncedAt))
    .limit(100);

  req.log.info({ count: products.length, clerkUserId }, "hotmart user: products listed");
  res.json(products);
});

// ─── USER: List sales/events — gated on per-user connection ──────────────────
router.get("/hotmart/user/sales", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthenticatedRequest).clerkUserId;

  const [conn] = await db
    .select()
    .from(userHotmartConnections)
    .where(eq(userHotmartConnections.clerkUserId, clerkUserId))
    .limit(1);

  if (!conn?.isActive || !conn?.accessToken) {
    res.json([]);
    return;
  }

  const events = await db
    .select()
    .from(hotmartEvents)
    .orderBy(desc(hotmartEvents.receivedAt))
    .limit(100);

  req.log.info({ count: events.length, clerkUserId }, "hotmart user: sales listed");
  res.json(events);
});

// ─── USER: Sync products from Hotmart API (uses platform credentials) ─────────
router.post("/hotmart/user/sync", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthenticatedRequest).clerkUserId;

  const [conn] = await db
    .select()
    .from(userHotmartConnections)
    .where(eq(userHotmartConnections.clerkUserId, clerkUserId))
    .limit(1);

  if (!conn?.isActive || !conn?.accessToken) {
    res.status(403).json({
      error: "Conecte sua conta Hotmart antes de sincronizar.",
    });
    return;
  }

  const [config] = await db.select().from(hotmartConfig).limit(1);
  if (!config?.clientId || !config?.clientSecret || !config?.basicToken) {
    res.status(503).json({
      error: "Credenciais Hotmart ainda não configuradas. Solicite ao administrador.",
    });
    return;
  }

  try {
    const token = await getHotmartAccessToken(
      config.clientId,
      config.clientSecret,
      config.basicToken,
      config.environment,
    );

    if (token.error || !token.access_token) {
      res.status(401).json({
        error: `Autenticação Hotmart falhou: ${token.error ?? "resposta sem access_token"}`,
      });
      return;
    }

    const { items, diagnostics } = await getHotmartProducts(token.access_token, config.environment);

    if (items.length === 0) {
      req.log.info({ diagnostics }, "hotmart user: sync — zero products");
      res.json({ ok: true, synced: 0, diagnostics });
      return;
    }

    let synced = 0;
    for (const item of items) {
      await db
        .insert(hotmartProducts)
        .values({
          productId: String(item.product.id),
          name:      item.product.name   ?? "",
          format:    item.product.format ?? "",
          status:    item.product.status ?? "ACTIVE",
          price:     String(item.price?.value ?? 0),
          currency:  item.price?.currency_code ?? "BRL",
          syncedAt:  new Date(),
        })
        .onConflictDoUpdate({
          target: hotmartProducts.productId,
          set: {
            name:     item.product.name   ?? "",
            format:   item.product.format ?? "",
            status:   item.product.status ?? "ACTIVE",
            price:    String(item.price?.value ?? 0),
            syncedAt: new Date(),
          },
        });
      synced++;
    }

    req.log.info({ synced, clerkUserId }, "hotmart user: sync complete");
    res.json({ ok: true, synced });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "hotmart user: sync error");
    res.status(500).json({ error: `Falha na sincronização: ${msg}` });
  }
});

// ─── ADMIN: Get platform config ────────────────────────────────────────────────
router.get("/hotmart/config", requireAdmin, async (_req, res): Promise<void> => {
  const [config] = await db.select().from(hotmartConfig).limit(1);
  if (!config) {
    res.json({
      configured: false,
      webhookUrl: `${DASHBOARD_HOTMART_URL}/api/hotmart/webhook`,
    });
    return;
  }
  res.json({
    configured:   true,
    clientId:     config.clientId,
    clientSecret: config.clientSecret ? "••••••••" + config.clientSecret.slice(-4) : "",
    basicToken:   config.basicToken ? "••••" : "",
    webhookToken: config.webhookToken ? "••••••••" + config.webhookToken.slice(-4) : "",
    environment:  config.environment,
    isActive:     config.isActive,
    updatedAt:    config.updatedAt,
    webhookUrl:   `${DASHBOARD_HOTMART_URL}/api/hotmart/webhook`,
  });
});

// ─── ADMIN: Save config ────────────────────────────────────────────────────────
const configSchema = z.object({
  clientId:     z.string().min(1),
  clientSecret: z.string().min(1),
  basicToken:   z.string().min(1),
  webhookToken: z.string().min(1),
  environment:  z.enum(["sandbox", "production"]).optional(),
});

router.post("/hotmart/config", requireAdmin, async (req, res): Promise<void> => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid payload", issues: parsed.error.issues });
    return;
  }
  const { clientId, clientSecret, basicToken, webhookToken, environment } = parsed.data;
  const [existing] = await db.select().from(hotmartConfig).limit(1);

  if (existing) {
    await db
      .update(hotmartConfig)
      .set({
        clientId, clientSecret, basicToken, webhookToken,
        environment: environment ?? existing.environment ?? "sandbox",
        isActive:    true,
        updatedAt:   new Date(),
      })
      .where(eq(hotmartConfig.id, existing.id));
  } else {
    await db.insert(hotmartConfig).values({
      clientId, clientSecret, basicToken, webhookToken,
      environment: environment ?? "sandbox",
      isActive:    true,
    });
  }

  req.log.info({ clientId, environment }, "hotmart: config saved");
  res.json({ ok: true });
});

// ─── ADMIN: Platform connection test ──────────────────────────────────────────
router.post("/hotmart/test", requireAdmin, async (req, res): Promise<void> => {
  const [config] = await db.select().from(hotmartConfig).limit(1);
  if (!config?.isActive) {
    res.status(503).json({ error: "Hotmart não configurado. Salve as credenciais primeiro." });
    return;
  }

  try {
    const token = await getHotmartAccessToken(
      config.clientId, config.clientSecret, config.basicToken, config.environment,
    );
    if (token.error || !token.access_token) {
      res.status(401).json({ error: `Autenticação falhou: ${token.error ?? "sem access_token"}` });
      return;
    }
    req.log.info({ environment: config.environment }, "hotmart: test connection ok");
    res.json({ ok: true, message: "Conexão com a API Hotmart estabelecida com sucesso." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "hotmart: test connection error");
    res.status(500).json({ error: msg });
  }
});

// ─── ADMIN: Sync products from platform credentials ────────────────────────────
router.post("/hotmart/sync-products", requireAdmin, async (req, res): Promise<void> => {
  const [config] = await db.select().from(hotmartConfig).limit(1);
  if (!config?.isActive) {
    res.status(503).json({ error: "Hotmart não configurado" });
    return;
  }

  try {
    const token = await getHotmartAccessToken(
      config.clientId, config.clientSecret, config.basicToken, config.environment,
    );
    if (!token.access_token) {
      res.status(401).json({ error: "Falha ao obter token Hotmart. Verifique as credenciais." });
      return;
    }

    const { items, diagnostics } = await getHotmartProducts(token.access_token, config.environment);

    if (items.length === 0) {
      req.log.info({ diagnostics }, "hotmart: sync-products — zero products");
      res.json({ ok: true, synced: 0, diagnostics,
        message: "Nenhum produto encontrado nesta credencial. Verifique se esta conta possui produtos próprios ou afiliações com permissão API.",
      });
      return;
    }

    let synced = 0;
    for (const item of items) {
      await db.insert(hotmartProducts).values({
        productId: String(item.product.id),
        name:      item.product.name    ?? "",
        format:    item.product.format  ?? "",
        status:    item.product.status  ?? "ACTIVE",
        price:     String(item.price?.value ?? 0),
        currency:  item.price?.currency_code ?? "BRL",
        syncedAt:  new Date(),
      }).onConflictDoUpdate({
        target: hotmartProducts.productId,
        set: {
          name:     item.product.name   ?? "",
          format:   item.product.format ?? "",
          status:   item.product.status ?? "ACTIVE",
          price:    String(item.price?.value ?? 0),
          syncedAt: new Date(),
        },
      });
      synced++;
    }

    req.log.info({ synced, diagnostics }, "hotmart: sync-products complete");
    res.json({ ok: true, synced, diagnostics });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "hotmart: sync-products unexpected error");
    res.status(422).json({ error: `Falha na sincronização: ${msg}` });
  }
});

// ─── ADMIN: List products ──────────────────────────────────────────────────────
router.get("/hotmart/products", requireAdmin, async (req, res): Promise<void> => {
  const DEFAULT_PRODUCT = {
    productId: "6095971", name: "Desbloqueando Sua Energia",
    format: "Produto próprio", status: "ACTIVE",
    price: "0", currency: "BRL", syncedAt: new Date(),
  } as const;

  await db.insert(hotmartProducts).values(DEFAULT_PRODUCT).onConflictDoNothing();

  const products = await db
    .select().from(hotmartProducts)
    .where(isNull(hotmartProducts.deletedAt))
    .orderBy(desc(hotmartProducts.syncedAt))
    .limit(100);

  req.log.info({ count: products.length }, "hotmart: products listed");
  res.json(products);
});

// ─── ADMIN: Manually create a product ─────────────────────────────────────────
const manualProductSchema = z.object({
  name:      z.string().min(1, "Nome obrigatório"),
  productId: z.string().min(1, "ID do produto obrigatório"),
  format:    z.string().optional().default("Produto próprio"),
  status:    z.string().optional().default("ACTIVE"),
  price:     z.string().optional().default("0"),
  currency:  z.string().optional().default("BRL"),
});

router.post("/hotmart/products/manual", requireAdmin, async (req, res): Promise<void> => {
  const parsed = manualProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { name, productId, format, status, price, currency } = parsed.data;
  await db.insert(hotmartProducts)
    .values({ name, productId, format, status, price, currency, syncedAt: new Date() })
    .onConflictDoUpdate({ target: hotmartProducts.productId, set: { name, format, status, syncedAt: new Date() } });

  const [product] = await db.select().from(hotmartProducts)
    .where(eq(hotmartProducts.productId, productId)).limit(1);

  req.log.info({ productId, name }, "hotmart: product created/updated manually");
  res.json({ ok: true, product });
});

// ─── ADMIN: List product trash ─────────────────────────────────────────────────
router.get("/hotmart/products/trash", requireAdmin, async (_req, res): Promise<void> => {
  const trashed = await db.select().from(hotmartProducts)
    .where(isNotNull(hotmartProducts.deletedAt))
    .orderBy(desc(hotmartProducts.deletedAt)).limit(100);
  res.json(trashed);
});

// ─── ADMIN: Restore product from trash ────────────────────────────────────────
router.post("/hotmart/products/:id/restore", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  await db.update(hotmartProducts).set({ deletedAt: null }).where(eq(hotmartProducts.id, id));
  await db.delete(trashItems).where(and(eq(trashItems.originalId, id), eq(trashItems.platform, "hotmart")));
  req.log.info({ id }, "hotmart: product restored from trash");
  res.json({ ok: true });
});

// ─── ADMIN: Permanently delete product ────────────────────────────────────────
router.delete("/hotmart/products/:id/permanent", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  await db.delete(hotmartProducts).where(eq(hotmartProducts.id, id));
  await db.delete(trashItems).where(and(eq(trashItems.originalId, id), eq(trashItems.platform, "hotmart")));
  req.log.info({ id }, "hotmart: product permanently deleted");
  res.json({ ok: true });
});

// ─── ADMIN: Soft delete product ────────────────────────────────────────────────
router.delete("/hotmart/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [product] = await db.select().from(hotmartProducts).where(eq(hotmartProducts.id, id)).limit(1);
  if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
  await db.update(hotmartProducts).set({ deletedAt: new Date() }).where(eq(hotmartProducts.id, id));
  await db.insert(trashItems).values({
    originalId: id, platform: "hotmart", itemType: "product",
    name: product.name ?? product.productId, previousStatus: product.status ?? "",
    snapshot: JSON.stringify(product),
    clerkUserId: (req as AdminRequest).clerkUserId,
  });
  req.log.info({ id }, "hotmart: product moved to trash");
  res.json({ ok: true });
});

// ─── ADMIN: List events ────────────────────────────────────────────────────────
router.get("/hotmart/events", requireAdmin, async (_req, res): Promise<void> => {
  const events = await db.select().from(hotmartEvents)
    .orderBy(desc(hotmartEvents.receivedAt)).limit(100);
  res.json(events);
});

// ─── ADMIN: List real per-user Hotmart connections ────────────────────────────
router.get("/hotmart/user-connections", requireAdmin, async (_req, res): Promise<void> => {
  const connections = await db
    .select()
    .from(userHotmartConnections)
    .where(eq(userHotmartConnections.isActive, true))
    .orderBy(desc(userHotmartConnections.createdAt))
    .limit(200);

  res.json(
    connections.map((c) => ({
      id:           c.id,
      clerkUserId:  c.clerkUserId,
      userName:     c.platformUsername ?? null,
      userEmail:    null,
      expiresAt:    c.expiresAt?.toISOString() ?? null,
      createdAt:    c.createdAt.toISOString(),
      isActive:     c.isActive,
    })),
  );
});

export default router;
