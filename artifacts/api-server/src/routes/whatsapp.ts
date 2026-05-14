import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, whatsappConfig, whatsappEvents } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { sendWhatsAppText } from "../lib/whatsapp.js";

const router: IRouter = Router();

// ─── PUBLIC: Meta webhook verification ─────────────────────────────────────
router.get("/whatsapp/webhook", (req, res): void => {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  req.log.info({ mode }, "whatsapp: webhook verify attempt");

  db.select()
    .from(whatsappConfig)
    .limit(1)
    .then(([config]) => {
      if (!config) {
        req.log.warn("whatsapp: no config found during verify");
        res.status(403).json({ error: "not configured" });
        return;
      }
      if (mode === "subscribe" && token === config.verifyToken) {
        req.log.info("whatsapp: webhook verified successfully");
        res.status(200).send(String(challenge));
      } else {
        req.log.warn({ mode }, "whatsapp: verify token mismatch");
        res.status(403).json({ error: "verification failed" });
      }
    })
    .catch((err: unknown) => {
      req.log.error({ err }, "whatsapp: webhook verify db error");
      res.status(500).json({ error: "internal" });
    });
});

// ─── PUBLIC: Receive events from Meta ──────────────────────────────────────
router.post("/whatsapp/webhook", (req, res): void => {
  const payload = req.body as Record<string, unknown>;

  type MetaEntry = { changes?: { value?: { messages?: { from?: string; type?: string }[] } }[] };
  const entry = (payload.entry as MetaEntry[] | undefined)?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];
  const eventType = message?.type ?? "status_update";
  const fromNumber = message?.from ?? null;

  req.log.info({ eventType, fromNumber }, "whatsapp: event received");

  db.insert(whatsappEvents)
    .values({ eventType, fromNumber, payload })
    .then(() => {
      res.status(200).json({ status: "ok" });
    })
    .catch((err: unknown) => {
      req.log.error({ err }, "whatsapp: failed to save event");
      res.status(200).json({ status: "ok" }); // always 200 — avoid Meta retries
    });
});

// ─── ADMIN: Get current config ──────────────────────────────────────────────
router.get("/whatsapp/config", requireAdmin, async (req, res): Promise<void> => {
  const [config] = await db.select().from(whatsappConfig).limit(1);
  if (!config) {
    res.json({ configured: false });
    return;
  }
  res.json({
    configured: true,
    businessAccountId: config.businessAccountId,
    phoneNumberId: config.phoneNumberId,
    accessToken: config.accessToken ? "••••••••" + config.accessToken.slice(-4) : "",
    verifyToken: config.verifyToken,
    webhookUrl: config.webhookUrl,
    isActive: config.isActive,
    updatedAt: config.updatedAt,
  });
});

// ─── ADMIN: Save config ─────────────────────────────────────────────────────
const configSchema = z.object({
  businessAccountId: z.string().min(1),
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(1),
  verifyToken: z.string().min(1),
  webhookUrl: z.string().optional(),
});

router.post("/whatsapp/config", requireAdmin, async (req, res): Promise<void> => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid payload", issues: parsed.error.issues });
    return;
  }
  const { businessAccountId, phoneNumberId, accessToken, verifyToken, webhookUrl } = parsed.data;
  const [existing] = await db.select().from(whatsappConfig).limit(1);

  if (existing) {
    await db
      .update(whatsappConfig)
      .set({
        businessAccountId,
        phoneNumberId,
        accessToken,
        verifyToken,
        webhookUrl: webhookUrl ?? "",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(whatsappConfig.id, existing.id));
  } else {
    await db.insert(whatsappConfig).values({
      businessAccountId,
      phoneNumberId,
      accessToken,
      verifyToken,
      webhookUrl: webhookUrl ?? "",
      isActive: true,
    });
  }

  req.log.info({ phoneNumberId }, "whatsapp: config saved");
  res.json({ ok: true });
});

// ─── ADMIN: List recent events ──────────────────────────────────────────────
router.get("/whatsapp/events", requireAdmin, async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(whatsappEvents)
    .orderBy(whatsappEvents.receivedAt)
    .limit(50);
  res.json(events);
});

// ─── ADMIN: Send test message ───────────────────────────────────────────────
const sendTestSchema = z.object({
  to: z.string().min(5),
  message: z.string().min(1),
});

router.post("/whatsapp/send-test", requireAdmin, async (req, res): Promise<void> => {
  const parsed = sendTestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid payload" });
    return;
  }
  const [config] = await db.select().from(whatsappConfig).limit(1);
  if (!config?.isActive) {
    res.status(503).json({ error: "WhatsApp não configurado" });
    return;
  }
  const result = await sendWhatsAppText(parsed.data.to, parsed.data.message, {
    phoneNumberId: config.phoneNumberId,
    accessToken: config.accessToken,
  });
  res.json({ ok: true, result });
});

export default router;
