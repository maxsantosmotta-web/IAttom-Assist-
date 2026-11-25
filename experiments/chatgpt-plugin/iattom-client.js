// Transport for existing IAttom APIs. Never route external writes to legacy
// website endpoints: those may debit credits in a separate browser request.
export function createIattomClient({ baseUrl, token, fetchImpl = fetch, allowWrites = false }) {
  const base = new URL(baseUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
    throw new Error("Invalid API origin");
  }
  if (typeof token !== "string" || !token) throw new Error("Missing authorization");
  const readPaths = new Set(["/api/chatgpt/account", "/api/chatgpt/projects", "/api/chatgpt/prompts"]);
  // Intentionally empty until the external backend routes own plan checks,
  // atomic consumption, idempotency and persistence. Enabling the flag alone
  // never permits calls to /api/ai/* or /api/help/chat.
  const operationPaths = new Set();
  return async function request(path, { method = "GET", body } = {}) {
    if (typeof path !== "string" || !path.startsWith("/api/chatgpt/") ||
        (method === "GET" ? !readPaths.has(path) || body !== undefined :
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
