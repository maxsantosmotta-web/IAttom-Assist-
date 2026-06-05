export type KnowledgeCategory =
  | "modules"
  | "integrations"
  | "credits"
  | "billing"
  | "workspace"
  | "roadmap";

export const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  modules: "Módulos de IA",
  integrations: "Integrações de Plataforma",
  credits: "Créditos",
  billing: "Faturamento",
  workspace: "Espaço de Trabalho",
  roadmap: "Roadmap e Limitações",
};
