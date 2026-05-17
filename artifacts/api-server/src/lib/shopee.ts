import crypto from "crypto";
import { logger } from "./logger.js";

const SHOPEE_API_BASE = "https://partner.shopeemobile.com/api/v2";
const SHOPEE_AUTH_PATH = "/api/v2/shop/auth_partner";

// ─── Signature ───────────────────────────────────────────────────────────────

export function generateShopeeSign(
  partnerId: string,
  partnerKey: string,
  path: string,
  timestamp: number,
  accessToken?: string,
  shopId?: string,
): string {
  let base = `${partnerId}${path}${timestamp}`;
  if (accessToken) base += accessToken;
  if (shopId) base += shopId;
  return crypto.createHmac("sha256", partnerKey).update(base).digest("hex");
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function generateShopeeOAuthUrl(
  partnerId: string,
  partnerKey: string,
  redirectUrl: string,
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateShopeeSign(partnerId, partnerKey, SHOPEE_AUTH_PATH, timestamp);
  const params = new URLSearchParams({
    partner_id: partnerId,
    timestamp: String(timestamp),
    sign,
    redirect: redirectUrl,
  });
  return `${SHOPEE_API_BASE}/shop/auth_partner?${params.toString()}`;
}

// ─── Token Refresh ────────────────────────────────────────────────────────────

export interface ShopeeTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expire_in?: number;
  error?: string;
  message?: string;
}

export async function refreshShopeeToken(
  partnerId: string,
  partnerKey: string,
  shopId: string,
  refreshToken: string,
): Promise<ShopeeTokenResponse> {
  const path = "/api/v2/auth/access_token/get";
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateShopeeSign(partnerId, partnerKey, path, timestamp);

  logger.info({ shopId }, "shopee: refreshing access token");

  const res = await fetch(`${SHOPEE_API_BASE}/auth/access_token/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partner_id: Number(partnerId),
      shop_id: Number(shopId),
      refresh_token: refreshToken,
      sign,
      timestamp,
    }),
  });

  return (await res.json()) as ShopeeTokenResponse;
}

// ─── Products (placeholder) ───────────────────────────────────────────────────

export interface ShopeeProductSummary {
  item_id: number;
  item_name?: string;
  price_info?: { current_price?: number }[];
  stock_info_v2?: { summary_info?: { total_reserved_stock?: number; total_available_stock?: number } };
  item_status?: string;
}

export async function getShopeeProducts(
  _partnerId: string,
  _partnerKey: string,
  _shopId: string,
  _accessToken: string,
): Promise<ShopeeProductSummary[]> {
  // TODO: GET /api/v2/product/get_item_list then GET /api/v2/product/get_item_base_info
  logger.info({ shopId: _shopId }, "shopee: getProducts (placeholder — not implemented)");
  return [];
}

// ─── Orders (placeholder) ─────────────────────────────────────────────────────

export interface ShopeeOrderSummary {
  order_sn: string;
  order_status?: string;
  total_amount?: number;
  buyer_username?: string;
  create_time?: number;
}

export async function getShopeeOrders(
  _partnerId: string,
  _partnerKey: string,
  _shopId: string,
  _accessToken: string,
): Promise<ShopeeOrderSummary[]> {
  // TODO: GET /api/v2/order/get_order_list then GET /api/v2/order/get_order_detail
  logger.info({ shopId: _shopId }, "shopee: getOrders (placeholder — not implemented)");
  return [];
}

// ─── Code → Token exchange ────────────────────────────────────────────────────

export async function exchangeShopeeCode(
  partnerId: string,
  partnerKey: string,
  code: string,
  shopId: string,
): Promise<ShopeeTokenResponse> {
  const path = "/api/v2/auth/token/get";
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateShopeeSign(partnerId, partnerKey, path, timestamp);

  logger.info({ shopId }, "shopee: exchanging auth code for token");

  const res = await fetch(`${SHOPEE_API_BASE}/auth/token/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      shop_id: Number(shopId),
      partner_id: Number(partnerId),
      sign,
      timestamp,
    }),
  });

  return (await res.json()) as ShopeeTokenResponse;
}

// ─── Webhook signature verification ──────────────────────────────────────────

export function verifyShopeeWebhook(partnerKey: string, body: string, authorization: string): boolean {
  const expected = crypto.createHmac("sha256", partnerKey).update(body).digest("hex");
  return expected === authorization;
}
