import { createIattomClient } from "./iattom-client.js";
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  isClerkAuthInfo,
  mcpAuth,
  protectedResourceMetadataHandler,
  streamableHttpHandler,
} from "@clerk/mcp-tools/express";

// A separate entry point keeps the connected development preview unchanged.
// Both keys must belong to the existing IAttom Clerk production instance.
export function startOfficial(port = Number(process.env.PORT ?? 8787), host = "127.0.0.1") {
  const resourceUrl = process.env.MCP_RESOURCE_URL;
  const accountApiUrl = process.env.IATTOM_ACCOUNT_API_URL;
  if (!resourceUrl || !accountApiUrl || !process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
    throw new Error("MCP_RESOURCE_URL, IATTOM_ACCOUNT_API_URL and the existing IAttom Clerk keys are required");
  }
  if (new URL(resourceUrl).protocol !== "https:" || new URL(accountApiUrl).protocol !== "https:") {
    throw new Error("Hosted MCP and account API must use HTTPS");
  }
  const authOptions = { resourceUrl, requiredScopes: ["profile"] };
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ exposedHeaders: ["WWW-Authenticate", "Mcp-Session-Id"] }));
  app.use(express.json());

  function createServer() {
    const server = new McpServer({ name: "iattom-assist", version: "1.0.0" });
    server.registerTool("consultar_minha_conta", {
      title: "Consultar minha conta IAttom",
      description: "Consulta o plano e o saldo da conta IAttom conectada. Somente leitura; não consome créditos.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    }, async (_args, { authInfo }) => {
      if (!isClerkAuthInfo(authInfo)) {
        return { content: [{ type: "text", text: "Conecte sua conta IAttom para consultar o plano." }], isError: true };
      }
      try {
        const response = await createIattomClient({ baseUrl: accountApiUrl, token: authInfo.token })("/api/chatgpt/account");
        if (!response.ok) {
          const message = response.status === 404 ? "Conta IAttom não encontrada." :
            response.status === 401 || response.status === 403 ? "Autorização da conta inválida." :
            "Não foi possível consultar a conta agora.";
          return { content: [{ type: "text", text: message }], isError: true };
        }
        const account = await response.json();
        const planNames = { free: "FREE", pro: "START", business: "PREMIUM", agency: "PRO" };
        const planName = planNames[account.plan];
        if (!planName) throw new Error("Unknown plan code");
        return { content: [{ type: "text", text: JSON.stringify({
          plan: planName,
          balance: account.balance,
          creativeBalance: account.creativeBalance,
          videoBalance: account.videoBalance,
          helpUsage: account.helpUsage,
        }) }] };
      } catch {
        return { content: [{ type: "text", text: "Não foi possível consultar a conta agora." }], isError: true };
      }
    });
    server.registerTool("listar_meus_projetos", {
      title: "Listar meus projetos IAttom",
      description: "Lista até 20 projetos recentes da conta IAttom conectada. Somente leitura; não consome créditos.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    }, async (_args, { authInfo }) => {
      if (!isClerkAuthInfo(authInfo)) {
        return { content: [{ type: "text", text: "Conecte sua conta IAttom para consultar os projetos." }], isError: true };
      }
      try {
        const response = await createIattomClient({ baseUrl: accountApiUrl, token: authInfo.token })("/api/chatgpt/projects");
        if (!response.ok) {
          const message = response.status === 401 || response.status === 403
            ? "Autorização da conta inválida."
            : "Não foi possível consultar os projetos agora.";
          return { content: [{ type: "text", text: message }], isError: true };
        }
        const data = await response.json();
        if (!Array.isArray(data.projects)) throw new Error("Invalid projects response");
        return { content: [{ type: "text", text: JSON.stringify({ projects: data.projects }) }] };
      } catch {
        return { content: [{ type: "text", text: "Não foi possível consultar os projetos agora." }], isError: true };
      }
    });
    server.registerTool("listar_meus_prompts", {
      title: "Listar meus prompts salvos IAttom",
      description: "Lista até 20 prompts salvos da conta conectada. Exige acesso ao módulo Criar Prompt. Somente leitura; não consome créditos.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    }, async (_args, { authInfo }) => {
      if (!isClerkAuthInfo(authInfo)) {
        return { content: [{ type: "text", text: "Conecte sua conta IAttom para consultar os prompts." }], isError: true };
      }
      try {
        const response = await createIattomClient({ baseUrl: accountApiUrl, token: authInfo.token })("/api/chatgpt/prompts");
        if (!response.ok) {
          const message = response.status === 403 ? "Plano necessário para acessar Criar Prompt." :
            response.status === 401 ? "Autorização da conta inválida." :
            "Não foi possível consultar os prompts agora.";
          return { content: [{ type: "text", text: message }], isError: true };
        }
        const data = await response.json();
        if (!Array.isArray(data.prompts)) throw new Error("Invalid prompts response");
        return { content: [{ type: "text", text: JSON.stringify({ prompts: data.prompts }) }] };
      } catch {
        return { content: [{ type: "text", text: "Não foi possível consultar os prompts agora." }], isError: true };
      }
    });

    server.registerTool("listar_minha_biblioteca", {
      title: "Consultar minha biblioteca IAttom",
      description: "Lista até 20 materiais salvos na biblioteca da conta conectada. Somente leitura, sem consumo de créditos.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    }, async (_args, { authInfo }) => {
      if (!isClerkAuthInfo(authInfo)) {
        return { content: [{ type: "text", text: "Conecte sua conta IAttom para consultar a biblioteca." }], isError: true };
      }
      try {
        const response = await createIattomClient({ baseUrl: accountApiUrl, token: authInfo.token })("/api/chatgpt/library");
        if (!response.ok) {
          return { content: [{ type: "text", text: response.status === 401 || response.status === 403
            ? "Autorização da conta inválida." : "Não foi possível consultar a biblioteca agora." }], isError: true };
        }
        const data = await response.json();
        if (!Array.isArray(data.items)) throw new Error("Invalid library response");
        return { content: [{ type: "text", text: JSON.stringify({ items: data.items }) }] };
      } catch {
        return { content: [{ type: "text", text: "Não foi possível consultar a biblioteca agora." }], isError: true };
      }
    });
    return server;
  }

  app.all("/mcp", mcpAuth(authOptions), streamableHttpHandler(createServer, StreamableHTTPServerTransport));
  app.all("/.well-known/oauth-protected-resource/mcp", protectedResourceMetadataHandler(authOptions));
  return app.listen(port, host);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  startOfficial(Number(process.env.PORT ?? 8787), process.env.HOST ?? "127.0.0.1");
}
