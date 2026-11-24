import test from "node:test";
import assert from "node:assert/strict";
import { start } from "./server.js";

test("isolated MCP requires Clerk OAuth and advertises its resource", async () => {
  process.env.MCP_RESOURCE_URL = "https://iattom-mcp-preview-test.up.railway.app/mcp";
  process.env.CLERK_OAUTH_ISSUER = "https://ample-chimp-6231.clerk.accounts.dev";
  const server = start(0);
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /infraestrutura de integração em desenvolvimento/);
    const metadata = await fetch(`${base}/.well-known/oauth-protected-resource/mcp`);
    assert.equal(metadata.status, 200);
    const details = await metadata.json();
    assert.equal(details.resource, process.env.MCP_RESOURCE_URL);
    assert.deepEqual(details.authorization_servers, [process.env.CLERK_OAUTH_ISSUER]);
    const denied = await fetch(`${base}/mcp`, { method: "GET" });
    assert.equal(denied.status, 401);
    assert.match(denied.headers.get("www-authenticate"), /resource_metadata=.*scope="profile"/);
    const invalid = await fetch(`${base}/mcp`, { method: "POST", headers: { authorization: "Bearer bogus", "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }) });
    assert.equal(invalid.status, 401);
    assert.equal((await fetch(`${base}/api/ai/create-campaign`, { method: "POST" })).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
