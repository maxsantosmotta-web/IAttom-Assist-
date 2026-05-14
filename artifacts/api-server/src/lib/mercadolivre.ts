import { logger } from "./logger.js";

const ML_API_BASE = "https://api.mercadolibre.com";
const ML_AUTH_BASE = "https://auth.mercadolibre.com.br/authorization";
const ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token";

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function generateMLOAuthUrl(appId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: appId,
    redirect_uri: redirectUri,
  });
  return `${ML_AUTH_BASE}?${params.toString()}`;
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

export interface MLTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  user_id?: number;
  error?: string;
  message?: string;
}

export async function exchangeMLCode(
  appId: string,
  clientSecret: string,
  redirectUri: string,
  code: string,
): Promise<MLTokenResponse> {
  logger.info("ml: exchanging OAuth code for token");

  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: appId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  return (await res.json()) as MLTokenResponse;
}

export async function refreshMLToken(
  appId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<MLTokenResponse> {
  logger.info("ml: refreshing access token");

  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: appId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  return (await res.json()) as MLTokenResponse;
}

// ─── Products (placeholder) ───────────────────────────────────────────────────

export interface MLProductSummary {
  id: string;
  title?: string;
  price?: number;
  available_quantity?: number;
  status?: string;
  category_id?: string;
  permalink?: string;
}

export async function getMLProducts(
  _accessToken: string,
  _userId: string,
): Promise<MLProductSummary[]> {
  // TODO: GET /users/{user_id}/items/search then GET /items?ids=...
  logger.info({ userId: _userId }, "ml: getProducts (placeholder — not implemented)");
  return [];
}

// ─── Orders (placeholder) ─────────────────────────────────────────────────────

export interface MLOrderSummary {
  id: number;
  status?: string;
  total_amount?: number;
  buyer?: { nickname?: string };
  date_created?: string;
}

export async function getMLOrders(
  _accessToken: string,
  _sellerId: string,
): Promise<MLOrderSummary[]> {
  // TODO: GET /orders/search?seller={seller_id}&sort=date_desc
  logger.info({ sellerId: _sellerId }, "ml: getOrders (placeholder — not implemented)");
  return [];
}

// ─── Generic authenticated request ───────────────────────────────────────────

export async function mlGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${ML_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    logger.warn({ status: res.status, path }, "ml: API request failed");
    throw new Error(`ML API error: ${res.status}`);
  }
  return (await res.json()) as T;
}
