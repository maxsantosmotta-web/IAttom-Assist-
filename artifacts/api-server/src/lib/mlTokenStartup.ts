import { eq } from "drizzle-orm";
import { db, mlConfig } from "@workspace/db";
import { logger } from "./logger.js";
import { refreshMLToken, registerMLToken, type MLTokenResponse } from "./mercadolivre.js";

async function persistGlobalToken(
  configId: number,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date | undefined,
): Promise<void> {
  await db
    .update(mlConfig)
    .set({ accessToken, refreshToken, tokenExpiry: expiresAt ?? null, updatedAt: new Date() })
    .where(eq(mlConfig.id, configId));
}

export async function rehydrateMLTokens(): Promise<void> {
  try {
    const [config] = await db.select().from(mlConfig).limit(1);

    if (!config?.isActive || !config.accessToken || !config.appId || !config.clientSecret) {
      return;
    }

    const appId       = config.appId;
    const clientSecret = config.clientSecret;
    const configId    = config.id;

    let accessToken  = config.accessToken;
    let refreshToken = config.refreshToken ?? "";
    let expiresAt: Date | undefined = config.tokenExpiry ?? undefined;

    const now       = new Date();
    const isExpired = expiresAt ? now >= expiresAt : false;

    if (isExpired) {
      if (!refreshToken) {
        logger.warn("ml startup: token expired and no refresh token — re-auth required");
        return;
      }
      try {
        const tokens = await refreshMLToken(appId, clientSecret, refreshToken);
        if (tokens.error || !tokens.access_token) {
          logger.warn(
            { error: tokens.error },
            "ml startup: token refresh failed — ML integration may require re-auth",
          );
          return;
        }
        accessToken  = tokens.access_token;
        refreshToken = tokens.refresh_token ?? refreshToken;
        expiresAt    = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined;
        await persistGlobalToken(configId, accessToken, refreshToken, expiresAt);
        logger.info("ml startup: expired global token refreshed and saved to DB");
      } catch (err) {
        logger.warn({ err }, "ml startup: token refresh threw — ML integration may require re-auth");
        return;
      }
    }

    registerMLToken(
      accessToken,
      refreshToken || undefined,
      expiresAt,
      appId,
      clientSecret,
      async (newToken: MLTokenResponse, newExpiry: Date | undefined): Promise<void> => {
        await persistGlobalToken(
          configId,
          newToken.access_token ?? "",
          newToken.refresh_token ?? refreshToken,
          newExpiry,
        );
      },
    );

    logger.info("ml startup: TokenManager rehydrated with DB tokens");
  } catch (err) {
    logger.warn({ err }, "ml startup: rehydration failed — ML integration may require re-auth");
  }
}
