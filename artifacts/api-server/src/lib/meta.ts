import { logger } from "./logger.js";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GraphPage {
  id: string;
  name: string;
  category?: string;
  access_token: string;
  instagram_business_account?: { id: string };
}

export interface GraphInstagramAccount {
  id: string;
  name?: string;
  username?: string;
  biography?: string;
  followers_count?: number;
}

export interface GraphComment {
  id: string;
  message?: string;
  from?: { id: string; name?: string };
  timestamp?: string;
}

// ─── Pages ──────────────────────────────────────────────────────────────────

export async function getPages(userAccessToken: string): Promise<GraphPage[]> {
  const url =
    `${GRAPH_BASE}/me/accounts?access_token=${userAccessToken}` +
    `&fields=id,name,category,access_token,instagram_business_account`;

  logger.info("meta: fetching facebook pages");

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, body }, "meta: failed to fetch pages");
    throw new Error(`Graph API error: ${res.status}`);
  }

  const data = (await res.json()) as { data: GraphPage[] };
  return data.data ?? [];
}

// ─── Instagram Accounts ─────────────────────────────────────────────────────

export async function getInstagramAccount(
  pageId: string,
  pageAccessToken: string,
): Promise<GraphInstagramAccount | null> {
  const url =
    `${GRAPH_BASE}/${pageId}?access_token=${pageAccessToken}` +
    `&fields=instagram_business_account{id,name,username,biography,followers_count}`;

  logger.info({ pageId }, "meta: fetching instagram account");

  const res = await fetch(url);
  if (!res.ok) {
    logger.warn({ status: res.status, pageId }, "meta: failed to fetch instagram account");
    return null;
  }

  const data = (await res.json()) as {
    instagram_business_account?: GraphInstagramAccount;
  };
  return data.instagram_business_account ?? null;
}

// ─── Webhook subscription ────────────────────────────────────────────────────

export async function subscribePageToWebhook(
  pageId: string,
  pageAccessToken: string,
): Promise<boolean> {
  const fields = "messages,messaging_postbacks,comments,feed,mention";
  const url =
    `${GRAPH_BASE}/${pageId}/subscribed_apps` +
    `?subscribed_fields=${fields}&access_token=${pageAccessToken}`;

  logger.info({ pageId }, "meta: subscribing page to webhook");

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    logger.warn({ status: res.status, pageId }, "meta: webhook subscription failed");
  }
  return res.ok;
}

// ─── Placeholders (automações futuras) ──────────────────────────────────────

/** TODO: GET /{media-id}/comments */
export async function getComments(
  _mediaId: string,
  _accessToken: string,
): Promise<GraphComment[]> {
  logger.info({ mediaId: _mediaId }, "meta: getComments (placeholder — not implemented)");
  return [];
}

/** TODO: GET /{ig-user-id}/conversations */
export async function getConversations(
  _igAccountId: string,
  _accessToken: string,
): Promise<unknown[]> {
  logger.info({ igAccountId: _igAccountId }, "meta: getConversations (placeholder — not implemented)");
  return [];
}

/** TODO: POST /{comment-id}/replies */
export async function replyToComment(
  _commentId: string,
  _message: string,
  _accessToken: string,
): Promise<unknown> {
  logger.info({ commentId: _commentId }, "meta: replyToComment (placeholder — not implemented)");
  return {};
}

/** TODO: POST /{page-id}/messages */
export async function sendMessage(
  _recipientId: string,
  _message: string,
  _pageAccessToken: string,
): Promise<unknown> {
  logger.info({ recipientId: _recipientId }, "meta: sendMessage (placeholder — not implemented)");
  return {};
}

/** TODO: GET /{page-id}/feed */
export async function getPageFeed(
  _pageId: string,
  _pageAccessToken: string,
): Promise<unknown[]> {
  logger.info({ pageId: _pageId }, "meta: getPageFeed (placeholder — not implemented)");
  return [];
}
