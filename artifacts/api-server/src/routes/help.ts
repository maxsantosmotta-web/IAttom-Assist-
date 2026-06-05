import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { setupSSE, sendSSE, sendSSEError, sendSSEDone } from "../lib/ai/stream.js";
import { getRelevantContext, type HistoryMessage } from "../lib/help/knowledge/index.js";

const router: IRouter = Router();

const SYSTEM_PROMPT = `Você é o IAttom, assistente oficial do IAttom Assist — plataforma de IA para negócios digitais.

REGRAS OBRIGATÓRIAS:
- Responda APENAS com base no contexto fornecido abaixo.
- Se a informação não estiver no contexto, responda exatamente: "Essa informação não está disponível no meu conhecimento atual."
- Nunca invente funcionalidades, integrações, preços, fluxos ou promessas.
- Quando uma funcionalidade estiver marcada como [ROADMAP — ainda não disponível], informe que ela está no roadmap aprovado mas ainda não está disponível.
- Quando estiver marcada como [NÃO DISPONÍVEL NO IATTOM ASSIST], informe que ela não existe na plataforma.
- Seja direto, profissional e objetivo. Sem emojis. Sem excesso de texto.
- Responda em português brasileiro.
- Mantenha o contexto da conversa — use o histórico para entender perguntas de acompanhamento.`;

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

  const relevantContext = getRelevantContext(message, conversationHistory);

  const systemWithContext = relevantContext
    ? `${SYSTEM_PROMPT}\n\nCONTEXTO RELEVANTE:\n${relevantContext}`
    : `${SYSTEM_PROMPT}\n\nNenhum contexto específico encontrado para esta pergunta. Se não souber responder, use a frase padrão de fallback.`;

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

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        sendSSE(res, { type: "chunk", content });
      }
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

export default router;
