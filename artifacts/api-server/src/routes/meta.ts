import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  metaConfig,
  metaEvents,
  metaPages,
  metaInstagramAccounts,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  getPages,
  getInstagramAccount,
  subscribePageToWebhook,
} from "../lib/meta.js";

const router: IRouter = Router();

// ─── PUBLIC: Meta webhook verification ──────────────────────────────────────
router.get("/meta/webhook", (req, res): void => {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  req.log.info({ mode }, "meta: webhook verify attempt");

  db.select()
    .from(metaConfig)
    .limit(1)
    .then(([config]) => {
      if (!config) {
        req.log.warn("meta: no config found during verify");
        res.status(403).json({ error: "not configured" });
        return;
      }
      if (mode === "subscribe" && token === config.verifyToken) {
        req.log.info("meta: webhook verified successfully");
        res.status(200).send(String(challenge));
      } else {
        req.log.warn({ mode }, "meta: verify token mismatch");
        res.status(403).json({ error: "verification failed" });
      }
    })
    .catch((err: unknown) => {
      req.log.error({ err }, "meta: webhook verify db error");
      res.status(500).json({ error: "internal" });
    });
});

// ─── PUBLIC: Receive events from Meta ───────────────────────────────────────
router.post("/meta/webhook", (req, res): void => {
  const payload = req.body as Record<string, unknown>;
  const object = (payload.object as string | undefined) ?? "unknown";

  const platform =
    object === "instagram" ? "instagram" : object === "page" ? "facebook" : object;

  type MetaEntry = {
    id?: string;
    changes?: { field?: string; value?: unknown }[];
  };
  const entry = (payload.entry as MetaEntry[] | undefined)?.[0];
  const change = entry?.changes?.[0];
  const eventType = (change?.field as string | undefined) ?? "unknown";
  const objectId = entry?.id ?? null;

  req.log.info({ platform, eventType, objectId }, "meta: event received");

  db.insert(metaEvents)
    .values({ platform, eventType, objectId, payload })
    .then(() => {
      res.status(200).json({ status: "ok" });
    })
    .catch((err: unknown) => {
      req.log.error({ err }, "meta: failed to save event");
      res.status(200).json({ status: "ok" }); // always 200 — avoid Meta retries
    });
});

// ─── ADMIN: Get config ───────────────────────────────────────────────────────
router.get("/meta/config", requireAdmin, async (_req, res): Promise<void> => {
  const [config] = await db.select().from(metaConfig).limit(1);
  if (!config) {
    res.json({ configured: false });
    return;
  }
  res.json({
    configured: true,
    appId: config.appId,
    appSecret: config.appSecret ? "••••••••" + config.appSecret.slice(-4) : "",
    verifyToken: config.verifyToken,
    userAccessToken: config.userAccessToken
      ? "••••••••" + config.userAccessToken.slice(-4)
      : "",
    webhookUrl: config.webhookUrl,
    isActive: config.isActive,
    updatedAt: config.updatedAt,
  });
});

// ─── ADMIN: Save config ──────────────────────────────────────────────────────
const configSchema = z.object({
  appId: z.string().min(1),
  appSecret: z.string().min(1),
  verifyToken: z.string().min(1),
  userAccessToken: z.string().min(1),
  webhookUrl: z.string().optional(),
});

router.post("/meta/config", requireAdmin, async (req, res): Promise<void> => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid payload", issues: parsed.error.issues });
    return;
  }
  const { appId, appSecret, verifyToken, userAccessToken, webhookUrl } = parsed.data;
  const [existing] = await db.select().from(metaConfig).limit(1);

  if (existing) {
    await db
      .update(metaConfig)
      .set({
        appId,
        appSecret,
        verifyToken,
        userAccessToken,
        webhookUrl: webhookUrl ?? "",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(metaConfig.id, existing.id));
  } else {
    await db.insert(metaConfig).values({
      appId,
      appSecret,
      verifyToken,
      userAccessToken,
      webhookUrl: webhookUrl ?? "",
      isActive: true,
    });
  }

  req.log.info({ appId }, "meta: config saved");
  res.json({ ok: true });
});

// ─── ADMIN: List events ──────────────────────────────────────────────────────
router.get("/meta/events", requireAdmin, async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(metaEvents)
    .orderBy(desc(metaEvents.receivedAt))
    .limit(50);
  res.json(events);
});

// ─── ADMIN: List Facebook Pages ──────────────────────────────────────────────
router.get("/meta/pages", requireAdmin, async (_req, res): Promise<void> => {
  const pages = await db.select().from(metaPages).orderBy(metaPages.name);
  res.json(pages);
});

// ─── ADMIN: List Instagram Accounts ─────────────────────────────────────────
router.get("/meta/instagram-accounts", requireAdmin, async (_req, res): Promise<void> => {
  const accounts = await db
    .select()
    .from(metaInstagramAccounts)
    .orderBy(metaInstagramAccounts.username);
  res.json(accounts);
});

// ─── ADMIN: Sync Facebook Pages ──────────────────────────────────────────────
router.post("/meta/sync-pages", requireAdmin, async (req, res): Promise<void> => {
  const [config] = await db.select().from(metaConfig).limit(1);
  if (!config?.isActive) {
    res.status(503).json({ error: "Meta não configurado" });
    return;
  }

  const pages = await getPages(config.userAccessToken);
  req.log.info({ count: pages.length }, "meta: syncing pages");

  for (const page of pages) {
    const [existing] = await db
      .select()
      .from(metaPages)
      .where(eq(metaPages.pageId, page.id))
      .limit(1);

    const values = {
      pageId: page.id,
      name: page.name,
      category: page.category ?? "",
      accessToken: page.access_token,
      instagramAccountId: page.instagram_business_account?.id ?? null,
      webhookSubscribed: false,
      syncedAt: new Date(),
    };

    if (existing) {
      await db.update(metaPages).set(values).where(eq(metaPages.pageId, page.id));
    } else {
      await db.insert(metaPages).values(values);
    }
  }

  res.json({ ok: true, synced: pages.length });
});

// ─── ADMIN: Sync Instagram Accounts ─────────────────────────────────────────
router.post("/meta/sync-instagram", requireAdmin, async (req, res): Promise<void> => {
  const pages = await db.select().from(metaPages);
  let synced = 0;

  for (const page of pages) {
    if (!page.instagramAccountId) continue;

    const igAccount = await getInstagramAccount(page.pageId, page.accessToken);
    if (!igAccount) continue;

    const [existing] = await db
      .select()
      .from(metaInstagramAccounts)
      .where(eq(metaInstagramAccounts.igId, igAccount.id))
      .limit(1);

    const values = {
      igId: igAccount.id,
      name: igAccount.name ?? "",
      username: igAccount.username ?? "",
      biography: igAccount.biography ?? "",
      followersCount: String(igAccount.followers_count ?? 0),
      pageId: page.pageId,
      syncedAt: new Date(),
    };

    if (existing) {
      await db
        .update(metaInstagramAccounts)
        .set(values)
        .where(eq(metaInstagramAccounts.igId, igAccount.id));
    } else {
      await db.insert(metaInstagramAccounts).values(values);
    }
    synced++;
  }

  req.log.info({ synced }, "meta: instagram accounts synced");
  res.json({ ok: true, synced });
});

// ─── ADMIN: Subscribe Page to Webhook ───────────────────────────────────────
router.post(
  "/meta/subscribe-page/:pageId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const pageId = req.params.pageId as string;

    const [page] = await db
      .select()
      .from(metaPages)
      .where(eq(metaPages.pageId, pageId))
      .limit(1);

    if (!page) {
      res.status(404).json({ error: "página não encontrada" });
      return;
    }

    const ok = await subscribePageToWebhook(page.pageId, page.accessToken);
    if (ok) {
      await db
        .update(metaPages)
        .set({ webhookSubscribed: true })
        .where(eq(metaPages.pageId, pageId));
    }

    req.log.info({ pageId, ok }, "meta: page webhook subscribe");
    res.json({ ok });
  },
);

export default router;
