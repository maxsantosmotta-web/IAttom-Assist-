import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { start } from "./server.js";

test("MCP exposes only the public catalog and blocks paid operations", async () => {
  const server = start(0);
  await new Promise(resolve => server.once("listening", resolve));
  const port = server.address().port;
  const client = new Client({ name: "iattom-test", version: "0.1.0" });
  try {
    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.match(page.headers.get("content-type"), /text\/html/);
    assert.match(await page.text(), /infraestrutura de integração em desenvolvimento/);
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal((await health.json()).status, "ok");
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)));
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(t => t.name), ["conhecer_iattom"]);
    const result = await client.callTool({ name: "conhecer_iattom", arguments: {} });
    const catalog = JSON.parse(result.content[0].text);
    assert.match(catalog.status, /nenhuma função/);
    assert.equal("modules" in catalog, false);
    const blocked = await client.callTool({ name: "criar_campanha", arguments: {} });
    assert.equal(blocked.isError, true);
    const response = await fetch(`http://127.0.0.1:${port}/api/ai/create-campaign`, { method: "POST" });
    assert.equal(response.status, 404);
  } finally {
    await client.close();
    await new Promise(resolve => server.close(resolve));
  }
});
