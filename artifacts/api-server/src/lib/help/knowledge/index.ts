import type { KnowledgeCategory } from "../helpCategories.js";
import { platform } from "./platform.js";
import { journeys } from "./journeys.js";
import { modules } from "./modules.js";
import { integrations } from "./integrations.js";
import { credits } from "./credits.js";
import { billing } from "./billing.js";
import { workspace } from "./workspace.js";
import { roadmap } from "./roadmap.js";

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  topic: string;
  keywords: string[];
  status: "active" | "future" | "unavailable";
  content: string;
  relatedTopics?: string[];
}

// Platform and journeys first — win tie-breaks for broad/goal-oriented queries
const ALL_ENTRIES: KnowledgeEntry[] = [
  ...platform,
  ...journeys,
  ...modules,
  ...integrations,
  ...credits,
  ...billing,
  ...workspace,
  ...roadmap,
];

const entryById = new Map<string, KnowledgeEntry>(
  ALL_ENTRIES.map((e) => [e.id, e])
);

function scoreEntry(entry: KnowledgeEntry, text: string): number {
  return entry.keywords.reduce((score, kw) => {
    return text.includes(kw.toLowerCase()) ? score + 1 : score;
  }, 0);
}

function formatEntry(entry: KnowledgeEntry): string {
  const statusNote =
    entry.status === "future"
      ? " [ROADMAP — ainda não disponível]"
      : entry.status === "unavailable"
        ? " [NÃO DISPONÍVEL NO IATTOM ASSIST]"
        : "";
  return `## ${entry.topic}${statusNote}\n${entry.content}`;
}

export interface HistoryMessage {
  role: "assistant" | "user";
  content: string;
}

const COMPARISON_RE =
  /diferen[cç]a|vs\b|versus|comparar|compara[cç][aã]o|qual (é )?melhor|entre .+ e /i;

/**
 * Domain keywords — used to distinguish "no keyword match for a valid
 * IAttom-related query" from "genuinely out of scope".
 * Substrings intentionally kept short to maximise recall (e.g. "começ" covers
 * both "começo" and "começar").
 */
const DOMAIN_KEYWORDS = [
  // Platform itself
  "iattom", "plataforma", "ferramenta", "assistente",
  // Core actions
  "vender", "venda", "vendas",
  "ganhar", "renda", "dinheiro", "faturar", "lucr", "monetiz",
  "criar", "gerar", "produzir", "lançar",
  "começ", "inici", "empreend",
  "crescer", "escalar", "otimiz", "melhorar",
  // Products / business types
  "produto", "produt",
  "ebook", "e-book",
  "curso", "aula", "treinamento",
  "afiliado", "afiliados", "comissão",
  "infoproduto",
  "negócio", "negócios", "empresa",
  // Marketing
  "campanha", "marketing", "anúncio",
  "conteúdo", "copy",
  "script", "roteiro",
  "imagem", "criativo",
  "estratégia", "funil", "lançamento",
  // Channels / integrations
  "marketplace", "shopee", "tiktok", "instagram", "facebook",
  "mercado livre", "hotmart", "kiwify", "whatsapp",
  // Platform concepts
  "crédito", "plano",
  "projeto", "salvar",
];

function isDomainQuery(text: string): boolean {
  return DOMAIN_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

export interface RetrievalResult {
  context: string;
  outOfScope: boolean;
}

/**
 * Returns the relevant knowledge context and an out-of-scope flag.
 *
 * Retrieval strategy (Etapa 3 + 5):
 * - Query carries 3× weight vs history (current question always wins)
 * - Only USER messages from history are used for scoring (avoids pollution from
 *   long assistant responses)
 * - Limit: 4 primary entries normally; 5 for comparison queries
 * - Journey entries expand the related-topic limit to 3 (for richer path context)
 * - When no entries match:
 *   - If query is domain-adjacent → broad fallback: platform-overview + platform-onboarding
 *   - If query is clearly out of scope → outOfScope: true
 */
export function getRelevantContext(
  query: string,
  history: HistoryMessage[]
): RetrievalResult {
  const queryText = query.toLowerCase();

  // Only user turns — assistant responses are verbose and pollute the score
  const historyText = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();

  const isComparison = COMPARISON_RE.test(query);

  // Score: query = 3× priority, history = 1× support
  const scored = ALL_ENTRIES
    .map((entry) => {
      const queryScore = scoreEntry(entry, queryText) * 3;
      const histScore = scoreEntry(entry, historyText);
      return { entry, score: queryScore + histScore };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  // Comparison queries get an extra slot so both sides land in context
  const primaryLimit = isComparison ? 5 : 4;
  const topEntries = scored.slice(0, primaryLimit).map(({ entry }) => entry);

  // When no specific entries matched, use domain detection to decide fallback
  if (topEntries.length === 0) {
    if (isDomainQuery(queryText)) {
      // Broad domain query with no specific match → return platform overview + onboarding
      const fallback = [
        entryById.get("platform-overview"),
        entryById.get("platform-onboarding"),
      ].filter((e): e is KnowledgeEntry => e !== undefined);
      return {
        context: fallback.map(formatEntry).join("\n\n---\n\n"),
        outOfScope: false,
      };
    }
    return { context: "", outOfScope: true };
  }

  // Journey entries warrant richer related-topic expansion (full path context)
  const hasJourneyOrPlatform = topEntries.some(
    (e) => e.category === "journeys" || e.category === "platform"
  );
  const relatedLimit = hasJourneyOrPlatform ? 3 : 1;

  // Resolve related topics
  const includedIds = new Set(topEntries.map((e) => e.id));
  const relatedIds = topEntries.flatMap((e) => e.relatedTopics ?? []);
  let added = 0;

  for (const id of relatedIds) {
    if (added >= relatedLimit) break;
    if (includedIds.has(id)) continue;
    const related = entryById.get(id);
    if (related) {
      topEntries.push(related);
      includedIds.add(id);
      added++;
    }
  }

  return {
    context: topEntries.map(formatEntry).join("\n\n---\n\n"),
    outOfScope: false,
  };
}
