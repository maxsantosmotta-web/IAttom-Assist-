import { createIattomClient } from "./iattom-client.js";
import { publicCatalog } from "./catalog.js";
import express from "express";
import cors from "cors";
import { z } from "zod";
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
  const authOptions = { resourceUrl, requiredScopes: ["profile"], publicAccess: { tools: ["conhecer_iattom"] } };
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ exposedHeaders: ["WWW-Authenticate", "Mcp-Session-Id"] }));
  app.use(express.json());

  function createServer() {
    const server = new McpServer({ name: "iattom-assist", version: "1.0.0" });
    server.registerTool("conhecer_iattom", {
      title: "Conhecer o IAttom Assist",
      description: "Mostra informações públicas do IAttom Assist. Não acessa contas ou funções pagas.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
      _meta: { securitySchemes: [{ type: "noauth" }] },
    }, async () => ({ content: [{ type: "text", text: JSON.stringify(publicCatalog) }] }));
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

    server.registerTool("consultar_uso_iattom_help", {
      title: "Consultar uso do IAttom Help",
      description: "Consulta elegibilidade e custo em créditos gerais do IAttom Help sem enviar mensagens ou consumir créditos.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    }, async (_args, { authInfo }) => {
      if (!isClerkAuthInfo(authInfo)) {
        return { content: [{ type: "text", text: "Conecte sua conta IAttom." }], isError: true };
      }
      try {
        const response = await createIattomClient({ baseUrl: accountApiUrl, token: authInfo.token })("/api/chatgpt/help/usage");
        if (!response.ok) return { content: [{ type: "text", text: "Consulta do IAttom Help indisponível." }], isError: true };
        const data = await response.json();
        if (typeof data.canUse !== "boolean" || typeof data.creditCost !== "number") {
          throw new Error("Invalid IAttom Help usage response");
        }
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch {
        return { content: [{ type: "text", text: "Consulta do IAttom Help indisponível." }], isError: true };
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

    server.registerTool("consultar_disponibilidade_modulo", {
      title: "Consultar disponibilidade de módulo IAttom",
      description: "Verifica sem executar se plano e saldo permitem solicitar um módulo. É uma prévia, não reserva créditos nem garante geração.",
      inputSchema: { feature: z.enum(["product_discovery", "product_validation", "campaign", "content", "video_script", "prompt_creation", "creativeImage1", "creativeImage2", "creativeImage3"]) },
      annotations: { readOnlyHint: true, openWorldHint: false },
    }, async ({ feature }, { authInfo }) => {
      if (!isClerkAuthInfo(authInfo)) {
        return { content: [{ type: "text", text: "Conecte sua conta IAttom para verificar a disponibilidade." }], isError: true };
      }
      try {
        // Preflight must use the same configured environment as operational execution.
        const response = await createIattomClient({ baseUrl: process.env.IATTOM_OPERATION_API_URL || accountApiUrl, token: authInfo.token })(`/api/chatgpt/operations/preflight/${feature}`);
        if (!response.ok) {
          return { content: [{ type: "text", text: response.status === 503
            ? "Operações externas ainda não estão habilitadas no ambiente consultado."
            : response.status === 401 || response.status === 403 ? "Autorização da conta inválida."
            : "Não foi possível consultar a disponibilidade do módulo." }], isError: true };
        }
        const result = await response.json();
        if (result.feature !== feature || typeof result.executionEnabled !== "boolean" || result.reserved !== false) {
          throw new Error("Invalid preflight response");
        }
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch {
        return { content: [{ type: "text", text: "Não foi possível consultar a disponibilidade do módulo." }], isError: true };
      }
    });

    // Operational tools are exposed only with an explicit isolated API.
    // Read-only tools may continue using the existing account API.
    if (process.env.CHATGPT_MCP_WRITES_ENABLED === "true" && process.env.IATTOM_OPERATION_API_URL) {
      const operationsBase = new URL(process.env.IATTOM_OPERATION_API_URL);
      const accountBase = new URL(accountApiUrl);
      if (operationsBase.protocol !== "https:" || operationsBase.origin === accountBase.origin ||
          operationsBase.pathname !== "/" || operationsBase.username || operationsBase.password ||
          operationsBase.search || operationsBase.hash) {
        throw new Error("A separate isolated HTTPS operation API origin is required");
      }

      server.registerTool("consultar_status_iattom_help", {
        title: "Consultar resposta anterior do IAttom Help",
        description: "Recupera a resposta de uma solicitação anterior do IAttom Help sem gerar novamente nem cobrar créditos.",
        inputSchema: { requestId: z.string().regex(/^[A-Za-z0-9_-]{16,72}$/) },
        annotations: { readOnlyHint: true, openWorldHint: false },
      }, async ({ requestId }, { authInfo }) => {
        if (!isClerkAuthInfo(authInfo)) {
          return { content: [{ type: "text", text: "Conecte sua conta IAttom." }], isError: true };
        }
        try {
          const response = await createIattomClient({ baseUrl: operationsBase.origin, token: authInfo.token })(
            `/api/chatgpt/help/status/${requestId}`);
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data) }], isError: !response.ok };
        } catch {
          return { content: [{ type: "text", text: "Não foi possível recuperar a resposta do Help." }], isError: true };
        }
      });
      server.registerTool("perguntar_ao_iattom_help", {
        title: "Perguntar ao IAttom Help",
        description: "Consulta o assistente de suporte interno original do IAttom. Desconta o custo real em créditos gerais apenas quando a resposta é concluída e salva na biblioteca do ambiente isolado.",
        inputSchema: {
          message: z.string().min(1).max(4000),
          requestId: z.string().regex(/^[A-Za-z0-9_-]{16,72}$/),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      }, async ({ message, requestId }, { authInfo }) => {
        if (!isClerkAuthInfo(authInfo)) {
          return { content: [{ type: "text", text: "Conecte sua conta IAttom." }], isError: true };
        }
        try {
          const response = await createIattomClient({ baseUrl: operationsBase.origin, token: authInfo.token, allowWrites: true })(
            "/api/chatgpt/help/execute", { method: "POST", body: { message, requestId } });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data) }], isError: !response.ok };
        } catch {
          return { content: [{ type: "text", text: "Não foi possível confirmar a resposta do Help. Consulte o registro original antes de repetir." }], isError: true };
        }
      });
      server.registerTool("iniciar_efeito_video_iattom", {
        title: "Gerar Vídeo com Efeito",
        description: "Inicia a animação de uma imagem já salva na biblioteca IAttom. Utiliza o saldo independente de vídeos, sem débito até a entrega final. Somente ambiente isolado.",
        inputSchema: {
          requestId: z.string().regex(/^[A-Za-z0-9_-]{16,72}$/),
          sourceProjectId: z.string().min(1),
          conceptIndex: z.number().int().nonnegative(),
          prompt: z.string().min(1).max(2000),
          format: z.enum(["vertical", "horizontal", "automatic"]),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      }, async (args, { authInfo }) => {
        if (!isClerkAuthInfo(authInfo)) {
          return { content: [{ type: "text", text: "Conecte sua conta IAttom." }], isError: true };
        }
        try {
          const response = await createIattomClient({ baseUrl: operationsBase.origin, token: authInfo.token, allowWrites: true })(
            "/api/chatgpt/video/submit", { method: "POST", body: args });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data) }], isError: !response.ok };
        } catch {
          return { content: [{ type: "text", text: "Não foi possível confirmar o envio. Consulte o status pela mesma chave antes de tentar novamente." }], isError: true };
        }
      });
      server.registerTool("consultar_status_efeito_video_iattom", {
        title: "Consultar processamento de Vídeo com Efeito",
        description: "Consulta a geração pela chave original sem criar novo vídeo ou consumir créditos.",
        inputSchema: { requestId: z.string().regex(/^[A-Za-z0-9_-]{16,72}$/) },
        annotations: { readOnlyHint: true, openWorldHint: false },
      }, async ({ requestId }, { authInfo }) => {
        if (!isClerkAuthInfo(authInfo)) {
          return { content: [{ type: "text", text: "Conecte sua conta IAttom." }], isError: true };
        }
        try {
          const response = await createIattomClient({ baseUrl: operationsBase.origin, token: authInfo.token })(
            `/api/chatgpt/video/status/${requestId}`);
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data) }], isError: !response.ok };
        } catch {
          return { content: [{ type: "text", text: "Não foi possível consultar o processamento." }], isError: true };
        }
      });
      server.registerTool("receber_efeito_video_iattom", {
        title: "Receber Vídeo com Efeito finalizado",
        description: "Entrega o vídeo pronto, com desconto único do saldo de vídeos e salvamento na biblioteca. Apenas para solicitações já iniciadas no ambiente isolado.",
        inputSchema: { requestId: z.string().regex(/^[A-Za-z0-9_-]{16,72}$/) },
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      }, async ({ requestId }, { authInfo }) => {
        if (!isClerkAuthInfo(authInfo)) {
          return { content: [{ type: "text", text: "Conecte sua conta IAttom." }], isError: true };
        }
        try {
          const response = await createIattomClient({ baseUrl: operationsBase.origin, token: authInfo.token, allowWrites: true })(
            "/api/chatgpt/video/collect", { method: "POST", body: { requestId } });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data) }], isError: !response.ok };
        } catch {
          return { content: [{ type: "text", text: "A entrega não pôde ser confirmada. Consulte a mesma chave antes de repetir." }], isError: true };
        }
      });
      server.registerTool("consultar_status_operacao_iattom", {
        title: "Consultar status de operação IAttom",
        description: "Recupera o resultado de uma solicitação de geração pela mesma chave, sem regenerar nem descontar créditos adicionais.",
        inputSchema: { requestId: z.string().regex(/^[A-Za-z0-9_-]{16,72}$/) },
        annotations: { readOnlyHint: true, openWorldHint: false },
      }, async ({ requestId }, { authInfo }) => {
        if (!isClerkAuthInfo(authInfo)) {
          return { content: [{ type: "text", text: "Conecte sua conta IAttom para consultar a operação." }], isError: true };
        }
        try {
          const response = await createIattomClient({ baseUrl: operationsBase.origin, token: authInfo.token })(
            `/api/chatgpt/operations/status/${requestId}`);
          const data = await response.json();
          if (!response.ok) {
            return { content: [{ type: "text", text: JSON.stringify({ error: data.error ?? "status_unavailable", status: response.status }) }], isError: true };
          }
          return { content: [{ type: "text", text: JSON.stringify(data) }] };
        } catch {
          return { content: [{ type: "text", text: "Não foi possível recuperar o status agora." }], isError: true };
        }
      });
      server.registerTool("executar_modulo_iattom", {
        title: "Executar módulo IAttom",
        description: "Executa um módulo de texto ou geração de imagens já existente no IAttom. Exige ambiente operacional isolado autorizado, debita os créditos correspondentes e salva na biblioteca. Requer pedido explícito de execução e chave única.",
        inputSchema: {
          feature: z.enum(["product_discovery", "product_validation", "campaign", "content", "video_script", "prompt_creation", "creativeImage1", "creativeImage2", "creativeImage3"]),
          input: z.record(z.unknown()),
          requestId: z.string().regex(/^[A-Za-z0-9_-]{16,72}$/),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      }, async ({ feature, input, requestId }, { authInfo }) => {
        if (!isClerkAuthInfo(authInfo)) {
          return { content: [{ type: "text", text: "Conecte sua conta IAttom para executar o módulo." }], isError: true };
        }
        try {
          const response = await createIattomClient({ baseUrl: operationsBase.origin, token: authInfo.token, allowWrites: true })(
            "/api/chatgpt/operations/execute", { method: "POST", body: { feature, input, requestId } });
          const data = await response.json();
          if (!response.ok) {
            return { content: [{ type: "text", text: JSON.stringify({ error: data.error ?? "operation_failed", status: response.status }) }], isError: true };
          }
          return { content: [{ type: "text", text: JSON.stringify(data) }] };
        } catch {
          return { content: [{ type: "text", text: "Falha na comunicação com a API operacional isolada. Não repita automaticamente a mesma operação com outra chave." }], isError: true };
        }
      });
    }
    return server;
  }

  app.all("/mcp", mcpAuth(authOptions), streamableHttpHandler(createServer, StreamableHTTPServerTransport));
  app.all("/.well-known/oauth-protected-resource/mcp", protectedResourceMetadataHandler(authOptions));
  return app.listen(port, host);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  startOfficial(Number(process.env.PORT ?? 8787), process.env.HOST ?? "127.0.0.1");
}
