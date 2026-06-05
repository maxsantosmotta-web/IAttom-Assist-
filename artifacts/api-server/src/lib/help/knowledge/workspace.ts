import type { KnowledgeEntry } from "./index.js";

export const workspace: KnowledgeEntry[] = [
  {
    id: "workspace-projects",
    category: "workspace",
    topic: "Projetos Salvos",
    keywords: ["projeto", "projetos salvos", "salvar", "salvo", "saved projects", "organizar"],
    status: "active",
    content: `Os resultados gerados pelos módulos de IA podem ser salvos como projetos para consulta futura.
Projetos salvos ficam organizados na seção Projetos Salvos com o contexto completo da geração original.
É possível acessar, revisitar e reutilizar qualquer projeto salvo a qualquer momento.
Rota: /dashboard/projects`,
    relatedTopics: ["workspace-history", "workspace-trash"],
  },
  {
    id: "workspace-trash",
    category: "workspace",
    topic: "Lixeira",
    keywords: ["lixeira", "excluir", "deletar", "restaurar", "recuperar", "trash", "apagar"],
    status: "active",
    content: `Projetos e itens excluídos vão para a Lixeira antes de serem removidos permanentemente.
Da Lixeira, é possível restaurar qualquer item para o estado anterior.
A exclusão permanente (direto da Lixeira) é irreversível — não há como recuperar após essa ação.
Rota: /dashboard/trash`,
    relatedTopics: ["workspace-projects"],
  },
  {
    id: "workspace-history",
    category: "workspace",
    topic: "Histórico de Atividades",
    keywords: ["histórico", "atividades", "history", "log", "registro", "atividade recente"],
    status: "active",
    content: `O Histórico de Atividades registra todos os usos dos módulos de IA com data, tipo de uso e créditos consumidos em cada operação.
Permite rastrear o que foi gerado em cada sessão e acompanhar o consumo de créditos ao longo do tempo.
Rota: /dashboard/history`,
    relatedTopics: ["workspace-projects", "credits-what-are"],
  },
  {
    id: "workspace-prompts",
    category: "workspace",
    topic: "Prompts Salvos",
    keywords: ["prompt", "prompts salvos", "salvar prompt", "reutilizar", "modelo de prompt"],
    status: "active",
    content: `Prompts frequentemente usados podem ser salvos para reutilização futura nos módulos de IA.
Elimina a necessidade de reescrever as mesmas instruções repetidamente.
Os prompts salvos ficam disponíveis diretamente nos módulos ao criar novo conteúdo.
Rota: /dashboard/prompts`,
  },
  {
    id: "workspace-referral",
    category: "workspace",
    topic: "Indicações",
    keywords: ["indicação", "indicar", "referral", "código de indicação", "compartilhar", "indicações"],
    status: "active",
    content: `Cada usuário possui um código de indicação único no formato XXXX-XXXX.
O link de indicação pode ser copiado e compartilhado diretamente pela plataforma.

Ao indicar:
- Quem indicou recebe +50 créditos quando o indicado usa o código.
- Quem foi indicado recebe +25 créditos ao ativar o código.

A seção exibe estatísticas completas de indicações e o histórico de uso do código.
Rota: /dashboard/referral`,
    relatedTopics: ["credits-referral"],
  },
  {
    id: "workspace-analytics",
    category: "workspace",
    topic: "Análises",
    keywords: ["análises", "analytics", "métricas", "estatísticas", "uso", "relatório", "desempenho"],
    status: "active",
    content: `A seção Análises exibe métricas de uso pessoal: histórico de créditos consumidos, uso por módulo de IA e evolução ao longo do tempo.
Permite acompanhar quais módulos são mais usados e como o saldo de créditos evoluiu.
Rota: /dashboard/analytics`,
    relatedTopics: ["credits-what-are", "workspace-history"],
  },
];
