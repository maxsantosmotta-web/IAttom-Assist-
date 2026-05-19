import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  shopeeConfig,
  mlConfig,
  hotmartConfig,
  kiwifyConfig,
  metaConfig,
  whatsappConfig,
  tiktokConfig,
  userTiktokConnections,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router: IRouter = Router();

function mask(val: string | null | undefined): string {
  if (!val) return "";
  if (val.length <= 4) return "••••••••";
  return "••••••••" + val.slice(-4);
}

function isMasked(val: string | undefined): boolean {
  return !val || val.startsWith("••");
}

// ─── GET all configs (masked) ─────────────────────────────────────────────────
router.get("/admin/integrations/config", requireAdmin, async (_req, res): Promise<void> => {
  const [shopee, ml, hotmart, kiwify, meta, whatsapp, tiktok, tiktokConns] = await Promise.all([
    db.select().from(shopeeConfig).limit(1),
    db.select().from(mlConfig).limit(1),
    db.select().from(hotmartConfig).limit(1),
    db.select().from(kiwifyConfig).limit(1),
    db.select().from(metaConfig).limit(1),
    db.select().from(whatsappConfig).limit(1),
    db.select().from(tiktokConfig).limit(1),
    db.select({ id: userTiktokConnections.id })
      .from(userTiktokConnections)
      .where(eq(userTiktokConnections.isActive, true))
      .limit(1),
  ]);

  const s = shopee[0];
  const m = ml[0];
  const h = hotmart[0];
  const k = kiwify[0];
  const me = meta[0];
  const wa = whatsapp[0];
  const tt = tiktok[0];

  res.json({
    shopee: {
      configured: !!(s?.partnerId && s?.partnerKey),
      isActive: s?.isActive ?? false,
      partnerId: s?.partnerId ?? "",
      partnerKey: mask(s?.partnerKey),
      redirectUrl: s?.redirectUrl ?? "",
      environment: "production",
      updatedAt: s?.updatedAt ?? null,
    },
    ml: {
      configured: !!(m?.appId && m?.clientSecret),
      isActive: m?.isActive ?? false,
      appId: m?.appId ?? "",
      clientSecret: mask(m?.clientSecret),
      redirectUri: m?.redirectUri ?? "",
      siteId: m?.siteId ?? "MLB",
      updatedAt: m?.updatedAt ?? null,
    },
    hotmart: {
      configured: !!(h?.clientId && h?.clientSecret),
      isActive: h?.isActive ?? false,
      clientId: h?.clientId ?? "",
      clientSecret: mask(h?.clientSecret),
      basicToken: mask(h?.basicToken),
      webhookToken: mask(h?.webhookToken),
      environment: h?.environment ?? "sandbox",
      updatedAt: h?.updatedAt ?? null,
    },
    kiwify: {
      configured: !!(k?.storeId && k?.clientId),
      isActive: k?.isActive ?? false,
      storeId: k?.storeId ?? "",
      clientId: k?.clientId ?? "",
      clientSecret: mask(k?.clientSecret),
      webhookSecret: mask(k?.webhookSecret),
      updatedAt: k?.updatedAt ?? null,
    },
    meta: {
      configured: !!(me?.appId && me?.appSecret),
      isActive: me?.isActive ?? false,
      appId: me?.appId ?? "",
      appSecret: mask(me?.appSecret),
      verifyToken: mask(me?.verifyToken),
      userAccessToken: mask(me?.userAccessToken),
      webhookUrl: me?.webhookUrl ?? "",
      updatedAt: me?.updatedAt ?? null,
    },
    whatsapp: {
      configured: !!(wa?.businessAccountId && wa?.accessToken),
      isActive: wa?.isActive ?? false,
      businessAccountId: wa?.businessAccountId ?? "",
      phoneNumberId: wa?.phoneNumberId ?? "",
      accessToken: mask(wa?.accessToken),
      verifyToken: mask(wa?.verifyToken),
      webhookUrl: wa?.webhookUrl ?? "",
      updatedAt: wa?.updatedAt ?? null,
    },
    tiktok: {
      configured: !!(tt?.clientKey && tt?.clientSecret),
      isActive: tiktokConns.length > 0,
      clientKey: tt?.clientKey ?? "",
      clientSecret: mask(tt?.clientSecret),
      redirectUri: tt?.redirectUri ?? "",
      environment: tt?.environment ?? "sandbox",
      updatedAt: tt?.updatedAt ?? null,
    },
  });
});

// ─── POST save config for :integration ───────────────────────────────────────
router.post("/admin/integrations/config/:integration", requireAdmin, async (req, res): Promise<void> => {
  const { integration } = req.params as { integration: string };
  const body = req.body as Record<string, string>;

  const pick = (key: string) => (isMasked(body[key]) ? undefined : (body[key] ?? undefined));

  try {
    switch (integration) {
      case "shopee": {
        const [existing] = await db.select().from(shopeeConfig).limit(1);
        const vals = {
          ...(pick("partnerId") !== undefined && { partnerId: pick("partnerId")! }),
          ...(pick("partnerKey") !== undefined && { partnerKey: pick("partnerKey")! }),
          ...(body.redirectUrl !== undefined && { redirectUrl: body.redirectUrl }),
          isActive: true,
          updatedAt: new Date(),
        };
        if (existing) {
          await db.update(shopeeConfig).set(vals).where(eq(shopeeConfig.id, existing.id));
        } else {
          await db.insert(shopeeConfig).values({ partnerId: "", partnerKey: "", ...vals });
        }
        break;
      }
      case "ml": {
        const [existing] = await db.select().from(mlConfig).limit(1);
        const vals = {
          ...(pick("appId") !== undefined && { appId: pick("appId")! }),
          ...(pick("clientSecret") !== undefined && { clientSecret: pick("clientSecret")! }),
          ...(body.redirectUri !== undefined && { redirectUri: body.redirectUri }),
          ...(body.siteId !== undefined && { siteId: body.siteId }),
          isActive: true,
          updatedAt: new Date(),
        };
        if (existing) {
          await db.update(mlConfig).set(vals).where(eq(mlConfig.id, existing.id));
        } else {
          await db.insert(mlConfig).values({ appId: "", clientSecret: "", ...vals });
        }
        break;
      }
      case "hotmart": {
        const [existing] = await db.select().from(hotmartConfig).limit(1);
        const vals = {
          ...(pick("clientId") !== undefined && { clientId: pick("clientId")! }),
          ...(pick("clientSecret") !== undefined && { clientSecret: pick("clientSecret")! }),
          ...(pick("basicToken") !== undefined && { basicToken: pick("basicToken")! }),
          ...(pick("webhookToken") !== undefined && { webhookToken: pick("webhookToken")! }),
          ...(body.environment !== undefined && { environment: body.environment }),
          isActive: true,
          updatedAt: new Date(),
        };
        if (existing) {
          await db.update(hotmartConfig).set(vals).where(eq(hotmartConfig.id, existing.id));
        } else {
          await db.insert(hotmartConfig).values({ clientId: "", clientSecret: "", basicToken: "", webhookToken: "", ...vals });
        }
        break;
      }
      case "kiwify": {
        const [existing] = await db.select().from(kiwifyConfig).limit(1);
        const vals = {
          ...(pick("storeId") !== undefined && { storeId: pick("storeId")! }),
          ...(pick("clientId") !== undefined && { clientId: pick("clientId")! }),
          ...(pick("clientSecret") !== undefined && { clientSecret: pick("clientSecret")! }),
          ...(pick("webhookSecret") !== undefined && { webhookSecret: pick("webhookSecret")! }),
          isActive: true,
          updatedAt: new Date(),
        };
        if (existing) {
          await db.update(kiwifyConfig).set(vals).where(eq(kiwifyConfig.id, existing.id));
        } else {
          await db.insert(kiwifyConfig).values({ storeId: "", clientId: "", clientSecret: "", webhookSecret: "", ...vals });
        }
        break;
      }
      case "meta":
      case "instagram":
      case "facebook": {
        const [existing] = await db.select().from(metaConfig).limit(1);
        const vals = {
          ...(pick("appId") !== undefined && { appId: pick("appId")! }),
          ...(pick("appSecret") !== undefined && { appSecret: pick("appSecret")! }),
          ...(pick("verifyToken") !== undefined && { verifyToken: pick("verifyToken")! }),
          ...(pick("userAccessToken") !== undefined && { userAccessToken: pick("userAccessToken")! }),
          ...(body.webhookUrl !== undefined && { webhookUrl: body.webhookUrl }),
          isActive: true,
          updatedAt: new Date(),
        };
        if (existing) {
          await db.update(metaConfig).set(vals).where(eq(metaConfig.id, existing.id));
        } else {
          await db.insert(metaConfig).values({ appId: "", appSecret: "", verifyToken: "", userAccessToken: "", ...vals });
        }
        break;
      }
      case "whatsapp": {
        const [existing] = await db.select().from(whatsappConfig).limit(1);
        const vals = {
          ...(pick("businessAccountId") !== undefined && { businessAccountId: pick("businessAccountId")! }),
          ...(pick("phoneNumberId") !== undefined && { phoneNumberId: pick("phoneNumberId")! }),
          ...(pick("accessToken") !== undefined && { accessToken: pick("accessToken")! }),
          ...(pick("verifyToken") !== undefined && { verifyToken: pick("verifyToken")! }),
          ...(body.webhookUrl !== undefined && { webhookUrl: body.webhookUrl }),
          isActive: true,
          updatedAt: new Date(),
        };
        if (existing) {
          await db.update(whatsappConfig).set(vals).where(eq(whatsappConfig.id, existing.id));
        } else {
          await db.insert(whatsappConfig).values({ businessAccountId: "", phoneNumberId: "", accessToken: "", verifyToken: "", ...vals });
        }
        break;
      }
      case "tiktok": {
        const [existing] = await db.select().from(tiktokConfig).limit(1);
        const vals = {
          ...(pick("clientKey") !== undefined && { clientKey: pick("clientKey")! }),
          ...(pick("clientSecret") !== undefined && { clientSecret: pick("clientSecret")! }),
          ...(body.redirectUri !== undefined && { redirectUri: body.redirectUri }),
          ...(body.environment !== undefined && { environment: body.environment }),
          isActive: true,
          updatedAt: new Date(),
        };
        if (existing) {
          await db.update(tiktokConfig).set(vals).where(eq(tiktokConfig.id, existing.id));
        } else {
          await db.insert(tiktokConfig).values({ clientKey: "", clientSecret: "", ...vals });
        }
        break;
      }
      default:
        res.status(400).json({ error: `Integração desconhecida: ${integration}` });
        return;
    }
    req.log.info({ integration }, "admin: api config saved");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, integration }, "admin: failed to save api config");
    res.status(500).json({ error: "Falha ao salvar configuração." });
  }
});

// ─── POST test config for :integration ───────────────────────────────────────
router.post("/admin/integrations/config/:integration/test", requireAdmin, async (req, res): Promise<void> => {
  const { integration } = req.params as { integration: string };

  try {
    switch (integration) {
      case "shopee": {
        const [cfg] = await db.select().from(shopeeConfig).limit(1);
        if (!cfg?.partnerId || !cfg?.partnerKey) {
          res.json({ ok: false, message: "Partner ID e Partner Key são obrigatórios." });
          return;
        }
        res.json({ ok: true, message: "Credenciais Shopee configuradas. Inicie o fluxo OAuth no painel do usuário para testar a conexão completa." });
        return;
      }
      case "ml": {
        const [cfg] = await db.select().from(mlConfig).limit(1);
        if (!cfg?.appId || !cfg?.clientSecret) {
          res.json({ ok: false, message: "Client ID e Client Secret são obrigatórios." });
          return;
        }
        res.json({ ok: true, message: "Credenciais Mercado Livre configuradas. Usuários podem iniciar o fluxo OAuth." });
        return;
      }
      case "hotmart": {
        const [cfg] = await db.select().from(hotmartConfig).limit(1);
        if (!cfg?.clientId || !cfg?.clientSecret) {
          res.json({ ok: false, message: "Client ID e Client Secret são obrigatórios." });
          return;
        }
        res.json({ ok: true, message: "Credenciais Hotmart configuradas." });
        return;
      }
      case "kiwify": {
        const [cfg] = await db.select().from(kiwifyConfig).limit(1);
        if (!cfg?.storeId || !cfg?.clientId) {
          res.json({ ok: false, message: "Store ID e Client ID são obrigatórios." });
          return;
        }
        res.json({ ok: true, message: "Credenciais Kiwify configuradas." });
        return;
      }
      case "meta":
      case "instagram":
      case "facebook": {
        const [cfg] = await db.select().from(metaConfig).limit(1);
        if (!cfg?.appId || !cfg?.appSecret) {
          res.json({ ok: false, message: "App ID e App Secret são obrigatórios." });
          return;
        }
        res.json({ ok: true, message: "Credenciais Meta configuradas para Instagram e Facebook." });
        return;
      }
      case "whatsapp": {
        const [cfg] = await db.select().from(whatsappConfig).limit(1);
        if (!cfg?.businessAccountId || !cfg?.accessToken) {
          res.json({ ok: false, message: "Business Account ID e Access Token são obrigatórios." });
          return;
        }
        res.json({ ok: true, message: "Credenciais WhatsApp Cloud API configuradas." });
        return;
      }
      case "tiktok": {
        const [cfg] = await db.select().from(tiktokConfig).limit(1);
        if (!cfg?.clientKey || !cfg?.clientSecret) {
          res.json({ ok: false, message: "Client Key e Client Secret são obrigatórios." });
          return;
        }
        res.json({ ok: true, message: "Credenciais TikTok configuradas." });
        return;
      }
      default:
        res.status(400).json({ error: `Integração desconhecida: ${integration}` });
    }
  } catch (err) {
    req.log.error({ err, integration }, "admin: failed to test api config");
    res.status(500).json({ error: "Falha ao testar configuração." });
  }
});

// ─── DELETE clear config for :integration ────────────────────────────────────
router.delete("/admin/integrations/config/:integration", requireAdmin, async (req, res): Promise<void> => {
  const { integration } = req.params as { integration: string };

  try {
    switch (integration) {
      case "shopee": {
        const [existing] = await db.select().from(shopeeConfig).limit(1);
        if (existing) {
          await db.update(shopeeConfig).set({ partnerId: "", partnerKey: "", redirectUrl: "", isActive: false, updatedAt: new Date() }).where(eq(shopeeConfig.id, existing.id));
        }
        break;
      }
      case "ml": {
        const [existing] = await db.select().from(mlConfig).limit(1);
        if (existing) {
          await db.update(mlConfig).set({ appId: "", clientSecret: "", redirectUri: "", isActive: false, updatedAt: new Date() }).where(eq(mlConfig.id, existing.id));
        }
        break;
      }
      case "hotmart": {
        const [existing] = await db.select().from(hotmartConfig).limit(1);
        if (existing) {
          await db.update(hotmartConfig).set({ clientId: "", clientSecret: "", basicToken: "", webhookToken: "", isActive: false, updatedAt: new Date() }).where(eq(hotmartConfig.id, existing.id));
        }
        break;
      }
      case "kiwify": {
        const [existing] = await db.select().from(kiwifyConfig).limit(1);
        if (existing) {
          await db.update(kiwifyConfig).set({ storeId: "", clientId: "", clientSecret: "", webhookSecret: "", isActive: false, updatedAt: new Date() }).where(eq(kiwifyConfig.id, existing.id));
        }
        break;
      }
      case "meta":
      case "instagram":
      case "facebook": {
        const [existing] = await db.select().from(metaConfig).limit(1);
        if (existing) {
          await db.update(metaConfig).set({ appId: "", appSecret: "", verifyToken: "", userAccessToken: "", isActive: false, updatedAt: new Date() }).where(eq(metaConfig.id, existing.id));
        }
        break;
      }
      case "whatsapp": {
        const [existing] = await db.select().from(whatsappConfig).limit(1);
        if (existing) {
          await db.update(whatsappConfig).set({ businessAccountId: "", phoneNumberId: "", accessToken: "", verifyToken: "", isActive: false, updatedAt: new Date() }).where(eq(whatsappConfig.id, existing.id));
        }
        break;
      }
      case "tiktok": {
        const [existing] = await db.select().from(tiktokConfig).limit(1);
        if (existing) {
          await db.update(tiktokConfig).set({ clientKey: "", clientSecret: "", redirectUri: "", isActive: false, updatedAt: new Date() }).where(eq(tiktokConfig.id, existing.id));
        }
        break;
      }
      default:
        res.status(400).json({ error: `Integração desconhecida: ${integration}` });
        return;
    }
    req.log.info({ integration }, "admin: api config cleared");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, integration }, "admin: failed to clear api config");
    res.status(500).json({ error: "Falha ao limpar configuração." });
  }
});

export default router;
