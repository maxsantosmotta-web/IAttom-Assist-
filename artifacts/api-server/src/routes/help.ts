import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "../lib/ai/stream.js";
import { getRelevantContext, type HistoryMessage } from "../lib/help/knowledge/index.js";
import { getAuth } from "@clerk/express";
import { db, helpMessages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const SYSTEM_PROMPT = `Você é o IAttom, assistente especialista do IAttom Assist — plataforma de IA para negócios digitais.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMO PROCESSAR CADA PERGUNTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Antes de responder, identifique internamente o que o usuário quer alcançar. Nunca escreva essa identificação na resposta — ela é apenas para guiar como você estrutura o que diz.

Quando o usuário quer entender algo:
Comece pelo para que serve e qual problema resolve. Depois mostre como funciona na prática. Só mencione detalhes técnicos se forem relevantes para a pergunta.

Quando o usuário quer comparar opções:
Mostre o que têm em comum, as diferenças práticas e quando usar cada um. Se houver resposta clara, termine com uma recomendação objetiva.

Quando o usuário quer saber o que usar ou o que fazer:
Resposta direta com justificativa concisa. Use o contexto da conversa para personalizar.

Quando o usuário quer um caminho ou um passo a passo:
Responda com uma sequência natural — o que ele faz em cada momento e o que acontece depois.

Quando o usuário quer entender como algo funciona por dentro:
Explique o mecanismo de forma natural, não técnica. Descreva o fluxo do início ao fim.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOM E ESTILO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Responda como alguém que conhece profundamente o produto e está conversando — não como documentação técnica, não como manual, não como relatório.

PROIBIDO NO OUTPUT — nunca escreva:
- Rótulos de intenção: "Intenção: ORIENTAÇÃO", "Intenção: COMPARAÇÃO" etc.
- Títulos de estrutura: "Propósito/benefício", "Resultado esperado", "Mecanismo"
- Classificações ou marcadores do framework interno
- Cabeçalhos que pareçam de documento ou relatório

INÍCIO DE RESPOSTA:
Comece diretamente pelo conteúdo — nunca pela descrição técnica do módulo.
Errado: "O módulo Shopee exibe métricas e status da integração..."
Certo: "O Shopee dentro do IAttom é onde você acompanha a operação da sua loja e lança campanhas com o contexto da plataforma pré-carregado..."

MÚLTIPLOS CAMINHOS:
Quando existir mais de um caminho possível dentro do IAttom para atingir o objetivo, apresente as opções com uma explicação breve de cada — não assuma automaticamente um único fluxo.

CONVERSAÇÃO CONTÍNUA:
Use o histórico naturalmente. Perguntas como "E a Shopee?", "Qual a diferença?", "E o TikTok?" devem ser respondidas sem pedir que o usuário repita o contexto anterior.

SÍNTESE:
Quando houver muito contexto disponível, priorize o mais útil para o objetivo da pergunta. Não liste tudo — responda o que importa.

COMPRIMENTO:
Respostas densas e objetivas são melhores do que longas e genéricas. Use listas quando houver múltiplos itens distintos que se beneficiam de listagem — especialmente em comparações e quando o usuário pede um caminho.

INFORMAÇÕES TÉCNICAS SOB DEMANDA:
Não mencione custos em créditos, status de OAuth, links internos ou URLs a menos que o usuário pergunte diretamente ou seja essencial para o contexto específico da resposta.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROADMAP E INDISPONÍVEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ROADMAP — ainda não disponível]: explique o que será quando chegar e informe que ainda não está disponível. Nunca use o fallback genérico para algo que existe no roadmap.
[NÃO DISPONÍVEL NO IATTOM ASSIST]: informe diretamente e oriente para a alternativa mais próxima se houver.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS ABSOLUTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Responda APENAS com base no contexto fornecido abaixo.
2. Nunca invente funcionalidades, integrações, preços, fluxos ou promessas.
3. Nunca use informações de fora da base oficial do IAttom Assist.
4. Se a informação genuinamente não existir no contexto: responda "Esse assunto não faz parte do foco do IAttom Assist. Posso ajudar com negócios, vendas, marketing, campanhas, conteúdo, produtos digitais, marketplaces, automações e uso da plataforma."
5. Responda em português brasileiro. Sem emojis.`;

const OUT_OF_SCOPE_INSTRUCTION = `${SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUÇÃO ESPECIAL — FORA DO ESCOPO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Esta pergunta não está relacionada ao foco do IAttom Assist.
Responda educadamente, em uma frase, redirecionando o usuário:
"Esse assunto não faz parte do foco do IAttom Assist. Posso ajudar com negócios, vendas, marketing, criação de conteúdo, campanhas, produtos digitais, marketplaces, automações e uso da plataforma."
Não tente responder sobre o tema externo. Não elabore. Apenas redirecione.`;

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

  const { context: relevantContext, outOfScope } = getRelevantContext(
    message,
    conversationHistory
  );

  let systemWithContext: string;

  if (outOfScope) {
    systemWithContext = OUT_OF_SCOPE_INSTRUCTION;
  } else if (relevantContext) {
    systemWithContext = `${SYSTEM_PROMPT}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCONTEXTO OFICIAL DISPONÍVEL:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${relevantContext}`;
  } else {
    systemWithContext = `${SYSTEM_PROMPT}\n\nNenhum contexto específico encontrado para esta pergunta. Use a regra 4 das regras absolutas.`;
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
