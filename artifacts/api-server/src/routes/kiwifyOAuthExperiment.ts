/**
 * EXPERIMENTO ISOLADO — Kiwify OAuth Authorization Code Flow
 *
 * Objetivo: validar se a Kiwify suporta Authorization Code Flow para usuários finais.
 * Este arquivo NÃO altera nenhuma rota existente, NÃO salva tokens, NÃO altera banco.
 * Pode ser removido após a validação experimental.
 *
 * Rotas:
 *   GET /api/kiwify/oauth/start    → gera URL de autorização e redireciona
 *   GET /api/kiwify/oauth/callback → registra parâmetros recebidos
 */

import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db, kiwifyConfig } from "@workspace/db";

const router: IRouter = Router();

const KIWIFY_AUTHORIZE_URL = "https://dashboard.kiwify.com.br/oauth/authorize";
const REDIRECT_URI = "https://iattomassist.com.br/api/kiwify/oauth/callback";

// ─── GET /kiwify/oauth/start ──────────────────────────────────────────────────

router.get("/kiwify/oauth/start", (req, res): void => {
  void (async () => {
    try {
      const [config] = await db.select().from(kiwifyConfig).limit(1);

      if (!config?.clientId) {
        req.log.warn("kiwify-oauth-experiment: no clientId configured — aborting");
        res.status(503).json({ error: "Kiwify não configurada. Configure clientId no ADM primeiro." });
        return;
      }

      const state = randomBytes(16).toString("hex");
      const params = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: REDIRECT_URI,
        state,
      });

      const authorizeUrl = `${KIWIFY_AUTHORIZE_URL}?${params.toString()}`;

      req.log.info(
        { authorizeUrl, clientId: config.clientId, state },
        "kiwify-oauth-experiment: URL de autorização gerada — redirecionando",
      );

      res.redirect(authorizeUrl);
    } catch (err) {
      req.log.error({ err }, "kiwify-oauth-experiment: erro ao gerar URL de autorização");
      res.status(500).json({ error: "Erro interno ao gerar URL de autorização." });
    }
  })();
});

// ─── GET /kiwify/oauth/callback ───────────────────────────────────────────────

router.get("/kiwify/oauth/callback", (req, res): void => {
  const { code, state, error, error_description } = req.query as Record<string, string | undefined>;

  if (error) {
    req.log.warn(
      { error, error_description, state },
      "kiwify-oauth-experiment: callback retornou ERRO — Authorization Code Flow provavelmente não suportado",
    );
    res.status(400).json({
      resultado: "ERRO",
      error,
      error_description: error_description ?? null,
      state: state ?? null,
      conclusao: "A Kiwify retornou erro. Authorization Code Flow provavelmente não está disponível.",
    });
    return;
  }

  if (code) {
    req.log.info(
      { code, state },
      "kiwify-oauth-experiment: callback recebeu CODE — Authorization Code Flow SUPORTADO",
    );
    res.status(200).json({
      resultado: "SUCESSO",
      code,
      state: state ?? null,
      conclusao: "A Kiwify retornou code. Authorization Code Flow está disponível para implementação.",
      proximo_passo: "Trocar code por token via POST /v1/oauth/token com grant_type=authorization_code.",
    });
    return;
  }

  req.log.warn(
    { query: req.query },
    "kiwify-oauth-experiment: callback recebeu resposta inesperada — sem code e sem error",
  );
  res.status(200).json({
    resultado: "INDETERMINADO",
    query_recebido: req.query,
    conclusao: "Callback atingido mas sem code nem error. Verificar manualmente os parâmetros.",
  });
});

export default router;
