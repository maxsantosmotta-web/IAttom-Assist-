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
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)));
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(t => t.name), ["conhecer_iattom"]);
    const result = await client.callTool({ name: "conhecer_iattom", arguments: {} });
    const catalog = JSON.parse(result.content[0].text);
    assert.match(catalog.freeAccess, /bloqueada/);
    assert.equal(catalog.modules.length, 5);
    assert.equal(catalog.modules[0].credits, 5);
    const blocked = await client.callTool({ name: "criar_campanha", arguments: {} });
    assert.equal(blocked.isError, true);
    const response = await fetch(`http://127.0.0.1:${port}/api/ai/create-campaign`, { method: "POST" });
    assert.equal(response.status, 404);
  } finally {
    await client.close();
    await new Promise(resolve => server.close(resolve));
  }
});
