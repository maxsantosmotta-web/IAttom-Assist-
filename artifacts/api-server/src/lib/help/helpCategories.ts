export type KnowledgeCategory =
  | "modules"
  | "integrations"
  | "credits"
  | "billing"
  | "workspace"
  | "roadmap"
  | "platform"
  | "journeys";

export const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  modules: "Módulos de IA",
  integrations: "Integrações de Plataforma",
  credits: "Créditos",
  billing: "Faturamento",
  workspace: "Espaço de Trabalho",
  roadmap: "Roadmap e Limitações",
  platform: "Sobre o IAttom Assist",
  journeys: "Jornadas e Objetivos",
};
