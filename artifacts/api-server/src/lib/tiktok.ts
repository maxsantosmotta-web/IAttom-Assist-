const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USERINFO_URL = "https://open.tiktokapis.com/v2/user/info/";

export function generateTikTokOAuthUrl(
  clientKey: string,
  redirectUri: string,
  state: string,
): string {
  const scopes = "user.info.basic";
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: scopes,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeTikTokCode(
  clientKey: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  open_id: string;
  expires_in: number;
  refresh_expires_in: number;
  scope: string;
}> {
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    open_id?: string;
    expires_in?: number;
    refresh_expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
    message?: string;
  };

  if (!res.ok || data.error || !data.access_token) {
    const msg =
      data.error_description ?? data.message ?? data.error ?? `HTTP ${res.status}`;
    throw new Error(`TikTok token exchange failed: ${msg}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
    open_id: data.open_id ?? "",
    expires_in: data.expires_in ?? 86400,
    refresh_expires_in: data.refresh_expires_in ?? 0,
    scope: data.scope ?? "",
  };
}

export async function getTikTokUserInfo(accessToken: string): Promise<{
  open_id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_url_100: string | null;
}> {
  const fields = "open_id,display_name,avatar_url,avatar_url_100";
  const res = await fetch(`${TIKTOK_USERINFO_URL}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = (await res.json()) as {
    data?: {
      user?: {
        open_id?: string;
        display_name?: string;
        avatar_url?: string;
        avatar_url_100?: string;
      };
    };
    error?: { code?: string; message?: string };
  };

  const user = data?.data?.user;
  if (!user) {
    throw new Error(
      `TikTok user info failed: ${data?.error?.message ?? String(res.status)}`,
    );
  }

  return {
    open_id: user.open_id ?? "",
    display_name: user.display_name ?? "",
    avatar_url: user.avatar_url ?? null,
    avatar_url_100: user.avatar_url_100 ?? null,
  };
}
