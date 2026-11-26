import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { start } from "./server.js";
import { moduleInput } from "./server-official.js";
import { createIattomClient } from "./iattom-client.js";

test("operational inputs preserve video script fields that overlap campaigns", () => {
  const input = { product: "Exemplo", format: "vertical", duration: "30s", hook: "Abertura", style: "direto" };
  assert.deepEqual(moduleInput.parse(input), input);
  assert.equal(moduleInput.safeParse({ product: "" }).success, false);
  assert.equal(moduleInput.safeParse({ selectedFormats: ["feed"] }).success, false);
});

test("operational transport preserves canonical fields and never retries or redirects writes", async () => {
  const input = { prompt: "x".repeat(2200), platform: "instagram", selectedFormats: ["feed"], additionalCanonicalField: { value: 1 } };
  assert.deepEqual(moduleInput.parse(input), input);
  const calls = [];
  const client = createIattomClient({ baseUrl: "https://sandbox.example.com", token: "test-token", allowWrites: true, fetchImpl: async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response(JSON.stringify({ status: "completed" }), { status: 200 });
  } });
  const body = { feature: "creativeImage1", input, requestId: "test-request-0001" };
  await client("/api/chatgpt/operations/execute", { method: "POST", body });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.redirect, "error");
  assert.deepEqual(JSON.parse(calls[0].options.body), body);
  await assert.rejects(client("/api/ai/creative-ideas", { method: "POST", body }));
  assert.equal(calls.length, 1);
});

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
    const client = new Client({ name: "sandbox-check", version: "1.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name), ["conhecer_iattom"]);
    await assert.rejects(client.callTool({ name: "conhecer_iattom", arguments: {} }));
    const protectedCall = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: "tools/call", params: { name: "conhecer_iattom", arguments: {} }, id: 2 }) });
    assert.equal(protectedCall.status, 401);
    await client.close();
    const invalid = await fetch(`${base}/mcp`, { method: "POST", headers: { authorization: "Bearer bogus", "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: "tools/call", params: { name: "conhecer_iattom", arguments: {} }, id: 1 }) });
    assert.equal(invalid.status, 401);
    assert.equal((await fetch(`${base}/api/ai/create-campaign`, { method: "POST" })).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
