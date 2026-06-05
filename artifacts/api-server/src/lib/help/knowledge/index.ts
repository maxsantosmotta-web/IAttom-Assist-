import type { KnowledgeCategory } from "../helpCategories.js";
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

const ALL_ENTRIES: KnowledgeEntry[] = [
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

/**
 * Returns a formatted context string with the most relevant knowledge entries
 * for the given query and recent conversation history.
 * Max 3 primary entries + up to 1 related entry.
 */
export function getRelevantContext(
  query: string,
  history: HistoryMessage[]
): string {
  // Combine query with recent history for richer keyword extraction
  const recentHistory = history.slice(-4).map((m) => m.content);
  const searchText = [query, ...recentHistory].join(" ").toLowerCase();

  // Score all entries
  const scored = ALL_ENTRIES
    .map((entry) => ({ entry, score: scoreEntry(entry, searchText) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  // Take top 3 primary entries
  const topEntries = scored.slice(0, 3).map(({ entry }) => entry);

  // Resolve related topics (add up to 1 related entry not already included)
  const includedIds = new Set(topEntries.map((e) => e.id));
  const relatedIds = topEntries.flatMap((e) => e.relatedTopics ?? []);

  for (const id of relatedIds) {
    if (includedIds.has(id)) continue;
    const related = entryById.get(id);
    if (related) {
      topEntries.push(related);
      break;
    }
  }

  if (topEntries.length === 0) return "";

  return topEntries.map(formatEntry).join("\n\n---\n\n");
}
