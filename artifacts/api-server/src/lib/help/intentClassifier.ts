/**
 * Semantic intent classifier for IAttom Help.
 *
 * Classifies user queries by INTENT (what the user wants to accomplish),
 * not by isolated keyword presence. Each intent has phrase signals (2 pts each)
 * and word signals (1 pt each). The highest-scoring intent above its threshold
 * wins. Returns UNKNOWN when no intent clears the threshold — the retrieval
 * engine then applies keyword scoring and domain detection as fallback.
 */

export type HelpIntent =
  | "ADVISOR_MODE"
  | "DECISION_MODE"
  | "ECONOMIC_REASONING_MODE"
  | "WHAT_NOT_TO_DO"
  | "PRIORITIZATION_MODE"
  | "PRE_MORTEM_MODE"
  | "PREMISE_CHALLENGE"
  | "START_FROM_ZERO"
  | "MONETIZE_KNOWLEDGE"
  | "DIGITAL_PRODUCT"
  | "PHYSICAL_PRODUCT"
  | "CREATE_CAMPAIGN"
  | "COMPARE_OPTIONS"
  | "GROW_BUSINESS"
  | "PLATFORM_USAGE"
  | "INTEGRATION_PURPOSE"
  | "UNKNOWN";

interface IntentSignals {
  /** Substring phrases — 2 points each on match */
  phrases: string[];
  /** Single words/substrings — 1 point each */
  words: string[];
  /** Minimum total score to activate this intent */
  threshold: number;
}

/**
 * Priority order for tie-breaking when two intents score equally.
 * Consultive intents rank above informational; specific above general.
 */
const INTENT_PRIORITY: HelpIntent[] = [
  "ADVISOR_MODE",            // most specific — user explicitly wants a partner/mentor opinion
  "DECISION_MODE",           // user asks what to choose — takes position, shows trade-offs
  "ECONOMIC_REASONING_MODE", // user asks about return, payback, risk-return, opportunity cost
  "WHAT_NOT_TO_DO",          // user wants to avoid mistakes — leads with risks
  "PRIORITIZATION_MODE",     // user has multiple options — eliminate, rank, justify
  "PRE_MORTEM_MODE",         // user asks where plan fails / what risks exist — adversarial analysis
  "PREMISE_CHALLENGE",       // user asks if they should do X — check prerequisites first
  "COMPARE_OPTIONS",
  "INTEGRATION_PURPOSE",
  "START_FROM_ZERO",
  "MONETIZE_KNOWLEDGE",
  "DIGITAL_PRODUCT",
  "PHYSICAL_PRODUCT",
  "CREATE_CAMPAIGN",
  "GROW_BUSINESS",
  "PLATFORM_USAGE",
  "UNKNOWN",
];

const SIGNALS: Record<Exclude<HelpIntent, "UNKNOWN">, IntentSignals> = {

  // ─── DECISION_MODE ────────────────────────────────────────────────────────
  // User asks what to choose between specific options, or which path to take.
  // Triggers decisive response: take a position, name the choice, show trade-offs,
  // explain why NOT the other options.
  // Distinct from ADVISOR_MODE (broader strategy) and COMPARE_OPTIONS (neutral comparison).
  DECISION_MODE: {
    phrases: [
      // Direct choice requests
      "o que você escolheria",
      "qual você escolheria",
      "qual caminho seguiria",
      "que caminho tomaria",
      "qual decisão tomaria",
      "qual seria sua decisão",
      "qual a sua escolha",
      "qual escolha faria",
      "qual opção escolheria",
      "qual plataforma escolheria",
      "que plataforma escolheria",
      "qual canal escolheria",
      // Decision-seeking framing
      "me ajude a decidir",
      "me ajude a escolher",
      "preciso decidir",
      "não sei qual escolher",
      "como decidir entre",
      "me diga qual",
      "qual seria a melhor decisão",
      // Regret / stakes framing
      "qual decisão tem maior chance de arrependimento",
      "qual tem maior chance de arrependimento",
      "qual arrependeria mais",
      "qual erro tem mais consequência",
      // Trade-off awareness
      "o que ganho e perco",
      "o que ganho com cada",
      "o que perco com cada",
      // Specific platform pairs — explicit choice framing
      "shopee ou mercado livre",
      "hotmart ou mercado livre",
      "hotmart ou kiwify",
      "kiwify ou hotmart",
      "mercado livre ou shopee",
      "produto físico ou digital",
      "físico ou digital",
      "digital ou físico",
    ],
    words: ["decidir", "decisão", "escolher", "escolha"],
    threshold: 2,
  },

  // ─── ECONOMIC_REASONING_MODE ──────────────────────────────────────────────
  // User asks about financial return, payback, risk-return, opportunity cost,
  // or compares two investments/paths from an economic lens.
  // Triggers: qualitative economic framework — capital, time-to-revenue, risk,
  // scalability, opportunity cost, payback speed. No exact numbers invented.
  // Distinct from DECISION_MODE (which option) — this is about economic quality of options.
  ECONOMIC_REASONING_MODE: {
    phrases: [
      // Return / profit queries
      "qual dá mais retorno",
      "qual dá mais lucro",
      "qual tem mais retorno",
      "qual tem maior retorno",
      "qual tem melhor retorno",
      "qual tem melhor margem",
      "qual tem mais margem",
      "maior margem",
      "mais lucro",
      "mais retorno",
      // "Is it worth it?" framing
      "vale a pena investir",
      "vale gastar",
      "compensa investir",
      "compensa gastar",
      "vale o investimento",
      "vale o esforço",
      // Where does money/time yield more
      "onde meu dinheiro rende mais",
      "onde meu capital rende mais",
      "onde meu tempo rende mais",
      "onde meu tempo vale mais",
      "onde vale investir",
      "em que investir",
      // Payback / recovery
      "qual recupera mais rápido",
      "qual recupera meu investimento",
      "recuperar o investimento",
      "recuperar o capital",
      "qual tem payback",
      "payback mais rápido",
      "retorno mais rápido",
      "qual gera caixa primeiro",
      "gerar caixa primeiro",
      "qual gera caixa",
      // Risk-return
      "qual tem melhor risco-retorno",
      "melhor risco-retorno",
      "risco-retorno",
      "relação risco",
      "menor risco com maior retorno",
      // Explicit investment comparisons
      "estoque ou tráfego",
      "tráfego ou estoque",
      "curso ou afiliado",
      "afiliado ou curso",
      "invisto em anúncios ou",
      "invisto em estoque ou",
      "invisto no tráfego ou",
      "shopee ou hotmart",
      "hotmart ou shopee",
      "mercado livre ou hotmart",
      "hotmart ou mercado livre",
      "marketplace ou hotmart",
      "físico ou digital",
      "digital ou físico",
      "anúncio ou estoque",
      "estoque ou anúncio",
      // Opportunity cost framing
      "custo de oportunidade",
      "o que deixo de ganhar",
      "o que perco ao",
      "vale 3 meses",
      "vale gastar meses",
      "compensa criar",
      "compensa antes de",
    ],
    words: ["retorno", "lucro", "margem", "payback", "compensa", "rende"],
    threshold: 2,
  },

  // ─── PRIORITIZATION_MODE ──────────────────────────────────────────────────
  // User has multiple options and needs to rank, order or focus.
  // Triggers: eliminate incompatible options → apply 6 criteria → rank → decide first.
  // Distinct from DECISION_MODE (binary choice) — this is about ordering a set.
  PRIORITIZATION_MODE: {
    phrases: [
      // Explicit ordering requests
      "qual faço primeiro",
      "qual fazer primeiro",
      "qual atacar primeiro",
      "qual começo primeiro",
      "por qual começar",
      "por onde atacar",
      "em que ordem",
      "ordem de prioridade",
      // Abandonment / elimination framing
      "qual abandono",
      "qual abandono primeiro",
      "qual descarto",
      "qual elimino",
      "o que elimino",
      "o que descarto",
      "o que corto",
      // Prioritization verbs
      "o que priorizo",
      "o que priorizar",
      "como priorizar",
      "qual priorizo",
      "quais priorizo",
      // Multiple options framing
      "tenho várias opções",
      "tenho muitas opções",
      "tenho três opções",
      "tenho duas opções",
      "tenho muitas ideias",
      "tenho várias ideias",
      "não sei qual primeiro",
      "não sei por qual começar",
      // Focus with resource constraints
      "onde focar primeiro",
      "onde devo focar",
      "no que focar",
      "em que focar",
      "onde colocar energia",
      "onde colocar atenção",
      "qual merece atenção agora",
      "qual merece minha atenção",
      // Impact / return framing
      "qual tem maior impacto",
      "o que tem maior impacto",
      "maior retorno primeiro",
      "maior impacto primeiro",
      // Resource constraint + "what first"
      "com pouco tempo",
      "com pouco dinheiro",
      "pouco tempo e não sei",
      "pouco dinheiro e não sei",
    ],
    words: ["priorizar", "prioridade", "prioridades", "ranquear", "ranking"],
    threshold: 2,
  },

  // ─── ADVISOR_MODE ─────────────────────────────────────────────────────────
  // User asks for a direct recommendation, as if speaking to a partner or mentor.
  // Triggers mentor/partner persona — strategy before any module listing.
  ADVISOR_MODE: {
    phrases: [
      "se você fosse meu sócio",
      "se fosse meu sócio",
      "o que você faria",
      "o que faria no meu lugar",
      "qual caminho você escolheria",
      "qual você escolheria",
      "me dá sua recomendação",
      "sua recomendação",
      "como você faria",
      "o que você recomenda",
      "o que você faria primeiro",
      "me aconselha",
      "se fosse você",
      "você no meu lugar",
      "qual seria sua escolha",
      "o que você escolheria",
      "o que você indicaria",
      "o que você acha que devo",
      "me indica o caminho",
      "o que você faria se fosse eu",
      "me dá um conselho",
    ],
    words: ["sócio", "aconselha", "aconselharia"],
    threshold: 2,
  },

  // ─── PRE_MORTEM_MODE ──────────────────────────────────────────────────────
  // User asks where a plan fails, what risks exist, or declares a risky action.
  // Triggers adversarial analysis: assume failure → work backwards → find causes.
  // Distinct from WHAT_NOT_TO_DO: this is backward-looking (assume it failed),
  // not forward-looking (what to avoid). Ranked above PREMISE_CHALLENGE.
  PRE_MORTEM_MODE: {
    phrases: [
      // Explicit failure location
      "onde falha",
      "onde isso falha",
      "onde meu plano falha",
      "onde ele falha",
      "onde ela falha",
      "onde pode falhar",
      "o que pode falhar",
      "o que vai falhar",
      "onde provavelmente falha",
      // Risk / weakness identification
      "qual o risco",
      "qual é o risco",
      "quais os riscos",
      "quais são os riscos",
      "qual risco",
      "qual a fraqueza",
      "qual é a fraqueza",
      "qual o ponto fraco",
      "quais os pontos fracos",
      "qual o ponto de falha",
      // Blind spots
      "o que eu não estou vendo",
      "o que não estou enxergando",
      "não estou enxergando",
      "qual risco não estou",
      "risco que não estou",
      "o que estou ignorando",
      "o que estou deixando de ver",
      "o que pode estar errado",
      // Failure scenario
      "se isso der errado",
      "se der errado",
      "se esse plano falhar",
      "se o plano falhar",
      "se esse negócio falhar",
      "se falhar",
      "quando falhar",
      "causa mais provável",
      "causa provável",
      // Fragile premise
      "qual a premissa errada",
      "premissa que pode estar errada",
      "premissa errada",
      "premissa frágil",
      // Risky imminent actions — user declares action, system should warn
      "vou investir todo meu dinheiro",
      "vou investir tudo",
      "vou colocar tudo",
      "vou gastar tudo",
      "curso completo antes de",
      "criar tudo antes de vender",
      "criar tudo antes de lançar",
      "vou criar um curso completo",
    ],
    words: ["falha", "fraqueza", "premissa"],
    threshold: 2,
  },

  // ─── WHAT_NOT_TO_DO ───────────────────────────────────────────────────────
  // User wants to know what to avoid, errors to prevent, or common mistakes.
  // Leads with risks and negative cases — not with modules.
  WHAT_NOT_TO_DO: {
    phrases: [
      "o que não deveria fazer",
      "o que eu não deveria",
      "o que não devo fazer",
      "o que não devo",
      "qual erro evitar",
      "quais erros evitar",
      "erro mais comum",
      "erros mais comuns",
      "o que costuma dar errado",
      "o que dá errado",
      "o que pode dar errado",
      "o que não funciona",
      "o que evitar",
      "quero evitar erros",
      "como não errar",
      "evitar errar",
      "não errar",
    ],
    words: ["evitar", "erros"],
    threshold: 2,
  },

  // ─── PREMISE_CHALLENGE ────────────────────────────────────────────────────
  // User is asking whether they should do X — check prerequisites before answering.
  PREMISE_CHALLENGE: {
    phrases: [
      "devo criar campanha",
      "devo fazer campanha",
      "devo conectar",
      "vale a pena",
      "vale a pena fazer",
      "vale a pena criar",
      "faz sentido",
      "faz sentido criar",
      "faz sentido fazer",
      "devo fazer isso",
      "devo fazer isso agora",
      "devo investir",
      "deveria criar campanha",
      "deveria conectar",
      "deveria lançar",
      "deveria publicar",
      "preciso fazer isso antes",
      "faz sentido agora",
      "esse é o momento",
      "é a hora certa",
      "é o momento de",
    ],
    words: [],
    threshold: 2,
  },

  // ─── COMPARE_OPTIONS ─────────────────────────────────────────────────────
  // User wants to choose between two options or understand which is better.
  COMPARE_OPTIONS: {
    phrases: [
      "ou shopee", "ou mercado livre", "ou hotmart", "ou kiwify",
      "ou tiktok", "ou instagram", "ou facebook", "ou whatsapp",
      "qual faz mais sentido", "qual é melhor", "qual o melhor",
      "qual canal", "qual plataforma", "qual integração",
      "onde devo vender", "onde é melhor vender",
      "qual caminho", "vale mais a pena", "o que vale mais",
      "marketplace ou", "shopee ou", "hotmart ou", "kiwify ou",
      "digital ou físico", "físico ou digital",
      "qual a diferença", "diferença entre",
      "qual vale mais", "vale mais",
    ],
    words: ["versus", " vs "],
    threshold: 2,
  },

  // ─── INTEGRATION_PURPOSE ─────────────────────────────────────────────────
  // User wants to understand WHY an integration exists — its purpose, benefit,
  // and how it helps them in practice. NOT a technical configuration question.
  INTEGRATION_PURPOSE: {
    phrases: [
      // Finalidade/utilidade
      "para que serve", "pra que serve",
      "qual a finalidade", "qual é a finalidade",
      "qual a utilidade", "qual é a utilidade",
      "qual o propósito", "qual é o propósito",
      // Por que conectar / por que existe
      "por que conectar", "porque conectar",
      "pra que conectar", "para que conectar",
      "por que existe", "pra que existe", "para que existe",
      "por que essa plataforma", "porque essa plataforma",
      "por que tem essa", "porque tem essa",
      "para que é essa", "pra que é essa",
      // O que ganho / o que muda
      "o que eu ganho", "o que ganho com",
      "o que muda se eu conectar", "o que muda se conectar",
      "o que muda com",
      // Vantagem/benefício
      "qual a vantagem dessa", "qual a vantagem de",
      "qual o benefício", "qual é o benefício",
      "quais os benefícios", "quais são os benefícios",
      "vantagem de ter", "vantagem de conectar",
      "que vantagem",
      // Como me ajuda
      "como me ajuda", "como essa plataforma me ajuda",
      "como o iattom usa", "como o iattom ajuda",
      // "dentro do iattom" (highly specific — signals a purpose question)
      "dentro do iattom", "dentro da plataforma",
      "funciona dentro", "funciona no iattom",
      "no iattom serve", "no iattom funciona",
      "serve dentro", "serve no iattom",
      // "pra que serve essa conexão"
      "pra que serve essa", "para que serve essa",
      "o que faz dentro", "o que serve",
    ],
    words: ["finalidade", "utilidade", "benefício"],
    threshold: 2,
  },

  // ─── START_FROM_ZERO ─────────────────────────────────────────────────────
  // User has no clear starting point — needs orientation and first steps.
  START_FROM_ZERO: {
    phrases: [
      "por onde começo", "por onde começar", "não sei por onde",
      "não sei como começar", "não sei o que fazer",
      "começo do zero", "começando do zero",
      "do zero", "do início",
      "primeiro passo", "primeiros passos", "qual o primeiro passo",
      "preciso de uma direção", "quero uma direção", "que direção",
      "estou perdido", "tô perdido", "estou confuso", "me perdi",
      "nunca fiz isso", "nunca vendi", "nunca trabalhei com",
      "não tenho experiência", "sem experiência",
      "o que fazer primeiro", "como eu começo", "como começo",
      "quero começar do", "quero começar a vender",
      "me indique", "me oriente", "me ajude a começar",
      "não tenho ideia", "não faço ideia",
      "se eu estivesse começando", "se estivesse começando",
      "estou começando", "acabei de começar",
    ],
    words: ["perdido", "desorientado", "iniciante"],
    threshold: 2,
  },

  // ─── MONETIZE_KNOWLEDGE ──────────────────────────────────────────────────
  // User has expertise, experience or a skill and wants to turn it into income.
  MONETIZE_KNOWLEDGE: {
    phrases: [
      "transformar conhecimento", "vender conhecimento", "monetizar conhecimento",
      "transformar experiência", "vender experiência", "monetizar experiência",
      "vender o que sei", "ganhar com o que sei",
      "ganhar com conhecimento", "ganhar com experiência", "ganhar com habilidade",
      "tenho conhecimento", "tenho expertise",
      "minha expertise", "minha experiência", "minha habilidade", "tenho habilidade",
      "sou bom em", "sou boa em", "sou especialista em",
      "pessoas me pedem", "me pedem ajuda", "me pediram ajuda",
      "empacotar experiência", "empacotar conhecimento",
      "compartilhar conhecimento", "ensinar o que sei",
      "o que sei fazer", "vender minha experiência",
      "anos de experiência", "conhecimento em renda",
      "experiência em renda", "experiência em produto",
      "como monetizo isso", "como ganho com isso", "ganho dinheiro com isso",
    ],
    words: ["expertise", "especialidade"],
    threshold: 2,
  },

  // ─── DIGITAL_PRODUCT ─────────────────────────────────────────────────────
  // User wants to create or launch a digital product (course, eBook, infoproduct).
  DIGITAL_PRODUCT: {
    phrases: [
      "produto digital", "criar produto digital", "vender produto digital",
      "lançar algo digital", "lançar online",
      "conteúdo pago", "vender conteúdo pago",
      "vender online sem", "sem estoque", "negócio sem estoque", "negócio digital",
      "infoproduto", "criar infoproduto", "vender infoproduto",
      "hotmart", "kiwify",
      "transformar ideia em produto", "ideia em produto",
      "venda digital", "lançamento digital",
      "lançar algo", "lançar um negócio", "lançar minha",
      "criar um curso online", "criar um curso", "fazer um curso",
      "vender um curso", "criar ebook", "fazer ebook", "vender ebook",
      "lançar um produto",
    ],
    words: [],
    threshold: 2,
  },

  // ─── PHYSICAL_PRODUCT ────────────────────────────────────────────────────
  // User wants to sell physical products on marketplaces (Shopee, Mercado Livre).
  PHYSICAL_PRODUCT: {
    phrases: [
      "produto físico", "vender produto físico", "produtos físicos",
      "vender na shopee", "na shopee",
      "vender no mercado livre", "no mercado livre",
      "trabalhar com marketplace", "vender em marketplace",
      "revender produtos", "revenda de produtos", "quero revender",
      "achar mercadorias", "vender mercadorias",
      "encontrar produto para vender", "achar produto para vender",
      "loja online", "loja virtual",
    ],
    words: ["shopee", "marketplace", "revenda", "mercadoria"],
    threshold: 2,
  },

  // ─── CREATE_CAMPAIGN ─────────────────────────────────────────────────────
  // User wants to market, advertise or improve sales for an existing product.
  CREATE_CAMPAIGN: {
    phrases: [
      "criar campanha", "criar uma campanha", "campanha completa",
      "campanha do zero", "montar campanha", "fazer campanha",
      "quero vender mais", "preciso vender mais",
      "divulgar meu produto", "divulgar produto", "divulgar minha loja",
      "divulgar meu", "divulgar melhor", "divulgar minha",
      "minhas vendas", "melhorar minhas vendas",
      "vendas fracas", "vendas ruins",
      "vendas estão caindo", "vendas estão baixas", "vendas estão fracas",
      "atrair clientes", "conseguir clientes", "conquistar clientes",
      "melhorar minha copy", "minha copy", "escrever copy",
      "criar anúncio", "fazer anúncio",
      "campanha de marketing", "estratégia de marketing",
      "preciso de uma campanha",
      "promover meu produto", "promover produto",
      "campanha que convença", "copy que venda", "texto de venda",
    ],
    words: ["campanha", "anúncio", "divulgar"],
    threshold: 2,
  },

  // ─── GROW_BUSINESS ───────────────────────────────────────────────────────
  // User has an existing business and wants to scale or improve results.
  GROW_BUSINESS: {
    phrases: [
      "crescer meu negócio", "escalar meu negócio", "escalar o negócio",
      "fazer meu negócio crescer", "negócio crescer",
      "melhorar meu negócio", "melhorar o negócio",
      "otimizar negócio", "estratégia de crescimento",
      "mais faturamento", "aumentar faturamento", "faturar mais",
      "resultados melhores", "melhorar resultados",
      "negócio estagnado",
    ],
    words: ["escalar", "faturamento"],
    threshold: 2,
  },

  // ─── PLATFORM_USAGE ──────────────────────────────────────────────────────
  // User wants to understand how the IAttom Assist platform works.
  PLATFORM_USAGE: {
    phrases: [
      "iattom", "iattom assist",
      "como funciona a plataforma", "como usar a plataforma",
      "para que serve a plataforma", "o que é a plataforma",
      "como funciona o iattom", "para que serve o iattom",
      "como usar o iattom",
    ],
    words: [],
    threshold: 2,
  },
};

function scoreIntent(signals: IntentSignals, text: string): number {
  const phraseScore = signals.phrases.reduce(
    (s, p) => (text.includes(p.toLowerCase()) ? s + 2 : s),
    0
  );
  const wordScore = signals.words.reduce(
    (s, w) => (text.includes(w.toLowerCase()) ? s + 1 : s),
    0
  );
  return phraseScore + wordScore;
}

export function classifyHelpIntent(queryText: string): HelpIntent {
  const text = queryText.toLowerCase();

  const candidates = (
    INTENT_PRIORITY.filter(
      (i): i is Exclude<HelpIntent, "UNKNOWN"> => i !== "UNKNOWN"
    ) as Exclude<HelpIntent, "UNKNOWN">[]
  )
    .map((intent) => ({ intent, score: scoreIntent(SIGNALS[intent], text) }))
    .filter(({ intent, score }) => score >= SIGNALS[intent].threshold);

  if (candidates.length === 0) return "UNKNOWN";

  // Highest score wins; INTENT_PRIORITY order already determines ties
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].intent;
}
