// Isolated transport for existing IAttom APIs. No billing or module logic here.
// Operational writes remain disabled until the test API is explicitly configured.
export function createIattomClient({ baseUrl, token, fetchImpl = fetch, allowWrites = false }) {
  const base = new URL(baseUrl);
  if (base.protocol !== "https:" || base.username || base.password) throw new Error("Invalid API origin");
  if (typeof token !== "string" || !token) throw new Error("Missing authorization");
  const readPaths = new Set(["/api/chatgpt/account", "/api/chatgpt/projects", "/api/chatgpt/prompts"]);
  const operationPaths = new Set(["/api/ai/find-products", "/api/ai/validate-product", "/api/ai/create-campaign", "/api/ai/create-content", "/api/ai/video-script", "/api/help/chat"]);
  return async function request(path, { method = "GET", body } = {}) {
    if (method === "GET" ? !readPaths.has(path) : method !== "POST" || !allowWrites || !operationPaths.has(path)) {
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
