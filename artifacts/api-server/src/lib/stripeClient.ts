import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

/**
 * Fetches Stripe credentials from the Replit connection API.
 * Falls back to STRIPE_SECRET_KEY env var if connector is unavailable.
 * Not cached — tokens can rotate, so fetch fresh each time.
 */
async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (hostname && xReplitToken) {
    try {
      const resp = await fetch(
        `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
        {
          headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (resp.ok) {
        const data = await resp.json() as {
          items?: Array<{ settings?: { secret_key?: string; webhook_secret?: string } }>;
        };
        const settings = data.items?.[0]?.settings;
        if (settings?.secret_key) {
          return {
            secretKey: settings.secret_key,
            webhookSecret: settings.webhook_secret,
          };
        }
      }
    } catch {
      // Fall through to env var fallback
    }
  }

  const key = process.env.STRIPE_SECRET_KEY ?? null;
  if (!key) {
    throw new Error(
      "Stripe is not configured. Connect Stripe via the Integrations tab, or set STRIPE_SECRET_KEY.",
    );
  }
  return { secretKey: key };
}

export function isStripeConfigured(): boolean {
  return !!(
    (process.env.REPLIT_CONNECTORS_HOSTNAME &&
      (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL)) ||
    process.env.STRIPE_SECRET_KEY
  );
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: "2025-08-27.basil" as any,
  });
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl, max: 2 },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? "",
  });
}
