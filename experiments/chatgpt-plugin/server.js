import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { publicCatalog } from "./catalog.js";

const previewPage = readFileSync(new URL("./index.html", import.meta.url), "utf8");

export function makeServer() {
  const server = new McpServer({ name: "iattom-assist-preview", version: "0.1.0" });
  server.registerTool("conhecer_iattom", {
    title: "Conhecer o IAttom Assist",
    description: "Mostra os módulos e os planos do IAttom Assist. Somente informações públicas; não executa funções pagas nem acessa contas.",
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async () => ({ content: [{ type: "text", text: JSON.stringify(publicCatalog) }] }));
  return server;
}

export function start(port = Number(process.env.PORT ?? 8787), host = "127.0.0.1") {
  const httpServer = createServer(async (req, res) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" });
      res.end(previewPage);
      return;
    }
    if (path === "/health" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", mode: "isolated-preview" }));
      return;
    }
    if (path !== "/mcp" || !["POST", "GET", "DELETE"].includes(req.method ?? "")) {
      res.writeHead(404).end("Not found");
      return;
    }
    const mcp = makeServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { void transport.close(); void mcp.close(); });
    try {
      await mcp.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("MCP request failed", error);
      if (!res.headersSent) res.writeHead(500).end("Internal server error");
    }
  });
  httpServer.listen(port, host);
  return httpServer;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  start(Number(process.env.PORT ?? 8787), process.env.HOST ?? "127.0.0.1");
}
