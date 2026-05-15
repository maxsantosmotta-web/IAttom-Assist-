import crypto from "crypto";
import { logger } from "./logger.js";

// OAuth token URL (same for sandbox and production)
const HOTMART_TOKEN_URL = "https://api-sec-vlc.hotmart.com/security/oauth/token";

// REST API base — DIFFERENT from the OAuth domain
// Sandbox: https://sandbox.hotmart.com
// Production: https://developers.hotmart.com
const HOTMART_API_BASE_SANDBOX = "https://sandbox.hotmart.com";
const HOTMART_API_BASE_PROD    = "https://developers.hotmart.com";

// ─── Webhook signature verification ──────────────────────────────────────────

export function verifyHotmartWebhook(
  webhookToken: string,
  receivedToken: string | undefined,
): boolean {
  if (!receivedToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(webhookToken),
    Buffer.from(receivedToken),
  );
}

// ─── OAuth token ──────────────────────────────────────────────────────────────

export interface HotmartTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
}

export async function getHotmartAccessToken(
  clientId: string,
  clientSecret: string,
  basicToken: string,
  environment: string,
): Promise<HotmartTokenResponse> {
  // Token URL is always api-sec-vlc.hotmart.com regardless of environment
  logger.info({ environment }, "hotmart: fetching access token");

  const res = await fetch(`${HOTMART_TOKEN_URL}?grant_type=client_credentials`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.warn({ status: res.status, body: text.slice(0, 200) }, "hotmart: token request failed");
    return { error: `HTTP ${res.status}` };
  }

  return (await res.json()) as HotmartTokenResponse;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface HotmartProductSummary {
  product: {
    id: number;
    name?: string;
    format?: string;
    status?: string;
  };
  price?: {
    value?: number;
    currency_code?: string;
  };
}

interface HotmartProductsResponse {
  items?: HotmartProductSummary[];
}

export async function getHotmartProducts(
  accessToken: string,
  environment: string,
): Promise<HotmartProductSummary[]> {
  const base = getHotmartApiBase(environment);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // Helper: read text, try parse as JSON, log body for debugging, never throw
  async function safeFetch(url: string): Promise<HotmartProductSummary[]> {
    let res: Response;
    try {
      res = await fetch(url, { headers });
    } catch (networkErr) {
      logger.warn({ url, err: networkErr }, "hotmart: network error fetching products");
      return [];
    }

    const raw = await res.text().catch(() => "");
    logger.info(
      { url, status: res.status, bodyPreview: raw.slice(0, 300) },
      "hotmart: products raw response",
    );

    if (!res.ok) {
      logger.warn({ url, status: res.status }, "hotmart: products endpoint non-2xx");
      return [];
    }

    if (!raw.trim()) {
      logger.warn({ url }, "hotmart: products response body is empty — no products or no permission");
      return [];
    }

    let parsed: HotmartProductsResponse;
    try {
      parsed = JSON.parse(raw) as HotmartProductsResponse;
    } catch {
      logger.warn({ url, raw: raw.slice(0, 300) }, "hotmart: products response is not valid JSON");
      return [];
    }

    const items = parsed.items ?? [];
    logger.info({ url, count: items.length }, "hotmart: products fetched ok");
    return items;
  }

  // ── Fetch own products ────────────────────────────────────────────────────
  const ownUrl = `${base}/products/api/v2/products`;
  logger.info({ environment, url: ownUrl }, "hotmart: fetching own products");
  const ownItems = await safeFetch(ownUrl);

  // ── Fetch affiliate products ──────────────────────────────────────────────
  const affUrl = `${base}/products/api/v2/products/affiliates`;
  logger.info({ environment, url: affUrl }, "hotmart: fetching affiliate products");
  const affiliateItems = await safeFetch(affUrl);

  // Merge, de-duplicate by product.id
  const seen = new Set<number>();
  const merged: HotmartProductSummary[] = [];
  for (const item of [...ownItems, ...affiliateItems]) {
    if (!seen.has(item.product.id)) {
      seen.add(item.product.id);
      merged.push(item);
    }
  }

  logger.info({ total: merged.length }, "hotmart: products merged (own + affiliates)");
  return merged;
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export interface HotmartSaleSummary {
  purchase: {
    transaction?: string;
    status?: string;
    price?: { value?: number; currency_code?: string };
  };
  buyer?: {
    email?: string;
    name?: string;
  };
}

interface HotmartSalesResponse {
  items?: HotmartSaleSummary[];
}

export async function getHotmartSales(
  accessToken: string,
  environment: string,
): Promise<HotmartSaleSummary[]> {
  const base = getHotmartApiBase(environment);
  logger.info({ environment }, "hotmart: fetching sales history");

  // Correct path: /payments/api/v1/sales/history (not /sales/api/v1)
  const res = await fetch(`${base}/payments/api/v1/sales/history?max_results=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.warn({ status: res.status, body: text.slice(0, 200) }, "hotmart: sales history error");
    return [];  // graceful — don't throw
  }

  const data = (await res.json()) as HotmartSalesResponse;
  return data.items ?? [];
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface HotmartSubscriptionSummary {
  subscriber_code?: string;
  status?: string;
  plan?: { name?: string };
  product?: { id?: number; name?: string };
  buyer?: { email?: string; name?: string };
  date_next_charge?: number;
}

interface HotmartSubscriptionsResponse {
  items?: HotmartSubscriptionSummary[];
}

export async function getHotmartSubscriptions(
  accessToken: string,
  environment: string,
): Promise<HotmartSubscriptionSummary[]> {
  const base = getHotmartApiBase(environment);
  logger.info({ environment }, "hotmart: fetching subscriptions");

  const res = await fetch(`${base}/payments/api/v1/subscriptions?max_results=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.warn({ status: res.status, body: text.slice(0, 200) }, "hotmart: subscriptions error");
    return [];  // graceful — don't throw
  }

  const data = (await res.json()) as HotmartSubscriptionsResponse;
  return data.items ?? [];
}

// ─── Event type labels ────────────────────────────────────────────────────────

export const HOTMART_EVENT_LABELS: Record<string, string> = {
  PURCHASE_APPROVED: "Compra Aprovada",
  PURCHASE_BILLET_PRINTED: "Boleto/Pix Gerado",
  PURCHASE_REFUNDED: "Reembolso",
  PURCHASE_CHARGEBACK: "Chargeback",
  PURCHASE_CANCELED: "Cancelado",
  PURCHASE_ABANDONED: "Abandono de Checkout",
  PURCHASE_COMPLETE: "Compra Concluída",
  PURCHASE_DELAYED: "Compra Atrasada",
  SUBSCRIPTION_ACTIVE: "Assinatura Ativa",
  SUBSCRIPTION_CANCELED: "Assinatura Cancelada",
  SUBSCRIPTION_REACTIVATED: "Assinatura Reativada",
  SWITCH_PLAN: "Mudança de Plano",
};

export function getHotmartApiBase(environment: string): string {
  return environment === "production" ? HOTMART_API_BASE_PROD : HOTMART_API_BASE_SANDBOX;
}
