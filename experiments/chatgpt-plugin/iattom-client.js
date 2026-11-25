// Transport for existing IAttom APIs. Never route external writes to legacy
// website endpoints: those may debit credits in a separate browser request.
export function createIattomClient({ baseUrl, token, fetchImpl = fetch, allowWrites = false }) {
  const base = new URL(baseUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
    throw new Error("Invalid API origin");
  }
  if (typeof token !== "string" || !token) throw new Error("Missing authorization");
  const readPaths = new Set(["/api/chatgpt/account", "/api/chatgpt/projects", "/api/chatgpt/prompts", "/api/chatgpt/library", "/api/chatgpt/help/usage"]);
  const preflightFeatures = new Set(["product_discovery", "product_validation", "campaign", "content", "video_script", "creativeImage1", "creativeImage2", "creativeImage3"]);
  const preflightPrefix = "/api/chatgpt/operations/preflight/";
  const statusPrefix = "/api/chatgpt/operations/status/";
  const isAllowedRead = (path) => readPaths.has(path) || (path.startsWith(preflightPrefix) && preflightFeatures.has(path.slice(preflightPrefix.length))) ||
    (path.startsWith(statusPrefix) && /^[A-Za-z0-9_-]{16,72}$/.test(path.slice(statusPrefix.length)));
  // Intentionally empty until the external backend routes own plan checks,
  // atomic consumption, idempotency and persistence. Enabling the flag alone
  // never permits calls to /api/ai/* or /api/help/chat.
  const operationPaths = new Set(["/api/chatgpt/operations/execute"]);
  return async function request(path, { method = "GET", body } = {}) {
    if (typeof path !== "string" || !path.startsWith("/api/chatgpt/") ||
        (method === "GET" ? !isAllowedRead(path) || body !== undefined :
         method !== "POST" || !allowWrites || !operationPaths.has(path))) {
      throw new Error("Operation not enabled");
    }
    const response = await fetchImpl(new URL(path, base.origin), {
      method, redirect: "error", signal: AbortSignal.timeout(30000),
      headers: { authorization: `Bearer ${token}`, accept: "application/json, text/event-stream", ...(body === undefined ? {} : {"content-type":"application/json"}) },
      ...(body === undefined ? {} : {body: JSON.stringify(body)})
    });
    return response;
  };
}
