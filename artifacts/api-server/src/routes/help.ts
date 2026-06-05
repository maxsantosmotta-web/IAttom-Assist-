import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "../lib/ai/stream.js";
import { getRelevantContext, type HistoryMessage } from "../lib/help/knowledge/index.js";
import { db, helpMessages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é o IAttom, assistente especialista do IAttom Assist — plataforma de IA para negócios digitais.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMO PROCESSAR CADA PERGUNTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Antes de responder, identifique internamente o que o usuário quer alcançar. Nunca escreva essa identificação na resposta.

Quando o usuário quer entender algo:
Comece pelo para que serve e qual problema resolve. Só detalhe o que for relevante.

Quando o usuário quer comparar opções:
Diferenças práticas + quando usar cada um + recomendação objetiva.

Quando o usuário quer saber o que fazer:
Resposta direta com justificativa concisa.

Quando o usuário quer um passo a passo:
Sequência natural — o que ele faz em cada momento.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOM E ESTILO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Responda como alguém que conhece profundamente o produto e está conversando.

PROIBIDO NO OUTPUT:
- Rótulos de intenção: "Intenção: ORIENTAÇÃO" etc.
- Títulos de estrutura: "Propósito/benefício", "Mecanismo"
- Cabeçalhos que pareçam de documento ou relatório

INÍCIO DE RESPOSTA:
Comece diretamente pelo conteúdo. Nunca pela descrição técnica do módulo.

CONVERSAÇÃO CONTÍNUA:
Use o histórico naturalmente. Perguntas como "E a Shopee?", "Qual a diferença?", "E o TikTok?" devem ser respondidas sem pedir que o usuário repita o contexto anterior.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPRIMENTO E FORMATO (OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Seja conciso. Respostas curtas e diretas são SEMPRE preferidas.

- Pergunta direta → 2 a 4 linhas. Nunca mais que isso sem necessidade real.
- Orientação ("o que faço?", "por onde começo?") → 2 a 3 passos práticos, sem introdução.
- Comparação → 3 a 4 linhas por opção + recomendação direta.
- Caminho/sequência → máximo 5 etapas numeradas, uma linha cada.
- Não repita o que o usuário disse. Não parafraseie. Vá direto ao ponto.
- Use listas apenas quando há 3+ itens distintos que se beneficiam de listagem.
- Se a resposta passar de 8 linhas, foi longa demais — revise antes de responder.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROADMAP E INDISPONÍVEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ROADMAP — ainda não disponível]: explique o que será e informe que ainda não está disponível.
[NÃO DISPONÍVEL NO IATTOM ASSIST]: informe diretamente e oriente para alternativa próxima.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS ABSOLUTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Responda APENAS com base no contexto fornecido.
2. Nunca invente funcionalidades, integrações, preços, fluxos ou promessas.
3. Nunca use informações de fora da base oficial do IAttom Assist.
4. Se a informação genuinamente não existir no contexto: "Esse assunto não faz parte do foco do IAttom Assist. Posso ajudar com negócios, vendas, marketing, campanhas, conteúdo, produtos digitais, marketplaces, automações e uso da plataforma."
5. Responda em português brasileiro. Sem emojis.`;

const OUT_OF_SCOPE_INSTRUCTION = `${SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUÇÃO ESPECIAL — FORA DO ESCOPO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Esta pergunta não está relacionada ao foco do IAttom Assist.
Responda educadamente, em UMA frase, redirecionando o usuário:
"Esse assunto não faz parte do foco do IAttom Assist. Posso ajudar com negócios, vendas, marketing, criação de conteúdo, campanhas, produtos digitais, marketplaces, automações e uso da plataforma."
Não elabore. Apenas redirecione.`;

// ── Helper: continuation detection (Bloco 6) ─────────────────────────────────

const CONTINUATION_RE =
  /^(continua|continue|continuar|segue|seguir|e aí|o que mais|mais\b|e depois|incompleto|cortou|ficou incompleto|resposta incompleta|não completou|pode continuar|prossiga|faltou|faltou parte|faltou algo|termina|terminar|completa|completar)\b/i;

function detectContinuation(message: string): boolean {
  return CONTINUATION_RE.test(message.trim());
}

function buildContinuationPrompt(lastAssistantContent: string): string {
  return `${SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODO CONTINUAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O usuário quer que você continue a resposta anterior. Continue diretamente do ponto onde parou, sem repetir o que já foi dito, sem introdução. Comece com "Continuando..." e prossiga a partir daqui:

${lastAssistantContent}`;
}

// ── Helper: context contradiction check (Bloco 7) ────────────────────────────
// If a meaningful word from the query appears in the LAST assistant response,
// the assistant itself introduced that term — it must explain it, not refuse.

function wasTermIntroducedByAssistant(
  query: string,
  history: HistoryMessage[]
): boolean {
  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant");
  if (!lastAssistant) return false;
  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 3);
  const lastText = lastAssistant.content.toLowerCase();
  return words.some((w) => lastText.includes(w));
}

// ── Helper: refusal loop protection (Bloco 8) ────────────────────────────────
// Prevent repeating "fora do escopo" when the previous response was already one.

const REFUSAL_SIGNATURE = "não faz parte do foco do iattom assist";

function lastResponseWasRefusal(history: HistoryMessage[]): boolean {
  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant");
  return Boolean(
    lastAssistant?.content.toLowerCase().includes(REFUSAL_SIGNATURE)
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────

router.post("/help/chat", requireAuth, async (req, res): Promise<void> => {
  const { message, history } = req.body as {
    message?: string;
    history?: HistoryMessage[];
  };

  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ error: "message é obrigatório." });
    return;
  }

  const conversationHistory: HistoryMessage[] = Array.isArray(history)
    ? history.slice(-6)
    : [];

  // ── Bloco 6: Continuation detection ───────────────────────────────────────
  const isContinuation = detectContinuation(message);
  const lastAssistantContent =
    conversationHistory
      .filter((m) => m.role === "assistant")
      .slice(-1)[0]?.content ?? "";

  // ── Retrieval ──────────────────────────────────────────────────────────────
  let { context: relevantContext, outOfScope } = getRelevantContext(
    message,
    conversationHistory
  );

  // ── Bloco 7: Context contradiction — term used by assistant must be explained
  if (outOfScope && wasTermIntroducedByAssistant(message, conversationHistory)) {
    outOfScope = false;
    // relevantContext stays empty — LLM will use conversation history as context
  }

  // ── Bloco 8: Refusal loop — don't repeat refusal if previous was already one
  if (outOfScope && lastResponseWasRefusal(conversationHistory)) {
    outOfScope = false;
    relevantContext = "";
  }

  // ── Build system prompt ────────────────────────────────────────────────────
  let systemWithContext: string;

  if (isContinuation && lastAssistantContent) {
    // Continuation mode takes priority
    systemWithContext = buildContinuationPrompt(lastAssistantContent);
  } else if (outOfScope) {
    systemWithContext = OUT_OF_SCOPE_INSTRUCTION;
  } else if (relevantContext) {
    systemWithContext = `${SYSTEM_PROMPT}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCONTEXTO OFICIAL DISPONÍVEL:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${relevantContext}`;
  } else {
    systemWithContext = `${SYSTEM_PROMPT}\n\nNenhum contexto específico encontrado. Use a regra 4 das regras absolutas.`;
  }

  setupSSE(res);
  sendSSE(res, { type: "start" });

  try {
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemWithContext },
      ...conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages,
      stream: true,
    });

    let chunkCount = 0;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        sendSSE(res, { type: "chunk", content });
        chunkCount++;
      }
    }

    if (chunkCount === 0) {
      req.log.warn({ msg: "LLM returned empty response", path: req.path });
      sendSSEError(
        res,
        "Não consegui concluir essa resposta agora. Tente reformular a pergunta ou me diga seu objetivo dentro do IAttom Assist para eu te orientar melhor."
      );
      return;
    }
  } catch {
    sendSSEError(
      res,
      "O IAttom Help está temporariamente indisponível. Tente novamente em alguns instantes."
    );
    return;
  }

  sendSSEDone(res);
});

// ── History: load ─────────────────────────────────────────────────────────────

router.get("/help/history", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(helpMessages)
      .where(eq(helpMessages.clerkUserId, userId))
      .orderBy(asc(helpMessages.createdAt))
      .limit(100);

    res.json(rows.map((r) => ({ id: r.id, role: r.role, content: r.content })));
  } catch {
    req.log.error({ msg: "Error loading help history", userId });
    res.status(500).json({ error: "Erro ao carregar histórico." });
  }
});

// ── History: save exchange ────────────────────────────────────────────────────

router.post("/help/save", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const { userMessage, assistantMessage } = req.body as {
    userMessage?: string;
    assistantMessage?: string;
  };

  if (
    !userMessage ||
    typeof userMessage !== "string" ||
    !assistantMessage ||
    typeof assistantMessage !== "string"
  ) {
    res.status(400).json({ error: "userMessage e assistantMessage são obrigatórios." });
    return;
  }

  try {
    await db.insert(helpMessages).values([
      { clerkUserId: userId, role: "user", content: userMessage.trim() },
      { clerkUserId: userId, role: "assistant", content: assistantMessage.trim() },
    ]);
    res.json({ ok: true });
  } catch {
    req.log.error({ msg: "Error saving help messages", userId });
    res.status(500).json({ error: "Erro ao salvar mensagem." });
  }
});

// ── History: clear ────────────────────────────────────────────────────────────

router.delete("/help/history", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  try {
    await db.delete(helpMessages).where(eq(helpMessages.clerkUserId, userId));
    res.json({ ok: true });
  } catch {
    req.log.error({ msg: "Error clearing help history", userId });
    res.status(500).json({ error: "Erro ao limpar histórico." });
  }
});

export default router;
