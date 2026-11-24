import { readFileSync } from "node:fs";
import express from "express";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { publicCatalog } from "./catalog.js";

const previewPage = readFileSync(new URL("./index.html", import.meta.url), "utf8");

export function makeServer() {
  const server = new McpServer({ name: "iattom-assist-sandbox", version: "0.2.0" });
  server.registerTool("conhecer_iattom", {
    title: "Conhecer o IAttom Assist",
    description: "Mostra informações públicas do IAttom Assist. Não acessa contas ou funções pagas.",
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async () => ({ content: [{ type: "text", text: JSON.stringify(publicCatalog) }] }));
  return server;
}

export function start(port = Number(process.env.PORT ?? 8787), host = "127.0.0.1") {
  const resourceUrl = process.env.MCP_RESOURCE_URL;
  if (!resourceUrl) throw new Error("MCP_RESOURCE_URL is required");
  const issuer = process.env.CLERK_OAUTH_ISSUER;
  if (!issuer || !issuer.startsWith("https://")) throw new Error("CLERK_OAUTH_ISSUER is required");
  const jwks = createRemoteJWKSet(new URL("/.well-known/jwks.json", issuer));
  const metadataUrl = new URL("/.well-known/oauth-protected-resource/mcp", resourceUrl).href;
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ exposedHeaders: ["WWW-Authenticate", "Mcp-Session-Id"] }));
  app.use(express.json());
  app.get("/", (_req, res) => res.type("html").set("Cache-Control", "no-store").send(previewPage));
  app.get("/health", (_req, res) => res.json({ status: "ok", mode: "isolated-authenticated" }));
  app.get("/.well-known/oauth-protected-resource/mcp", (_req, res) => res.json({
    resource: resourceUrl,
    authorization_servers: [issuer],
    scopes_supported: ["profile"],
    bearer_methods_supported: ["header"],
  }));
  app.all("/mcp", async (req, res, next) => {
    const challenge = `Bearer resource_metadata="${metadataUrl}", scope="profile"`;
    const match = /^Bearer ([^\s]+)$/.exec(req.get("authorization") ?? "");
    if (!match) return res.set("WWW-Authenticate", challenge).status(401).end();
    try {
      const { payload } = await jwtVerify(match[1], jwks, { issuer, audience: resourceUrl, algorithms: ["RS256"] });
      const scopes = typeof payload.scope === "string" ? payload.scope.split(/\s+/) : [];
      if (!scopes.includes("profile")) return res.set("WWW-Authenticate", `Bearer resource_metadata="${metadataUrl}", error="insufficient_scope", scope="profile"`).status(403).end();
      next();
    } catch {
      return res.set("WWW-Authenticate", `${challenge}, error="invalid_token"`).status(401).end();
    }
  }, async (req, res) => {
    const mcp = makeServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { void transport.close(); void mcp.close(); });
    try { await mcp.connect(transport); await transport.handleRequest(req, res, req.body); }
    catch (error) { console.error("MCP request failed", error); if (!res.headersSent) res.status(500).end(); }
  });
  return app.listen(port, host);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  start(Number(process.env.PORT ?? 8787), process.env.HOST ?? "127.0.0.1");
}
