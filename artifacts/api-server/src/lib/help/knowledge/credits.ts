import type { KnowledgeEntry } from "./index.js";

export const credits: KnowledgeEntry[] = [
  {
    id: "credits-what-are",
    category: "credits",
    topic: "O que são créditos",
    keywords: ["crédito", "créditos", "saldo", "o que são créditos", "como funcionam créditos", "moeda"],
    status: "active",
    content: `Créditos são a moeda de uso do IAttom Assist.
Cada uso de um módulo de IA consome uma quantidade específica de créditos do saldo do usuário.
O saldo é reiniciado de acordo com o ciclo do plano (mensal ou anual).
Créditos de bônus (indicação) podem elevar o saldo acima do limite do plano — o display é limitado a 100% na barra visual, mas os créditos excedentes são utilizados normalmente.
Ao atingir 0 créditos, os módulos de IA ficam bloqueados até a renovação do ciclo ou upgrade de plano.
O IAttom Help não consome créditos.`,
    relatedTopics: ["credits-feature-costs", "credits-plans", "credits-referral"],
  },
  {
    id: "credits-feature-costs",
    category: "credits",
    topic: "Custo de créditos por módulo",
    keywords: ["custo", "quanto custa", "gasta", "créditos por uso", "preço em créditos", "consumo"],
    status: "active",
    content: `Custo de créditos por módulo de IA:

Buscar Produtos:    5 créditos por uso
Validar Produtos:   5 créditos por uso
Criar Campanha:    10 créditos por uso
Criar Conteúdo:     8 créditos por uso
Gerador Criativo:  15 créditos por uso
Scripts de Vídeo:  10 créditos por uso

O IAttom Help não consome créditos — é um recurso de suporte interno.`,
    relatedTopics: ["credits-what-are", "credits-plans"],
  },
  {
    id: "credits-plans",
    category: "credits",
    topic: "Limites de créditos por plano",
    keywords: ["plano", "limite de créditos", "créditos do plano", "quantos créditos", "plano free", "plano pro", "start", "completo", "premium"],
    status: "active",
    content: `Créditos incluídos por plano:

START    (Free):        50 créditos — R$19,90/mês
COMPLETO (Pro):        500 créditos — R$89/mês ou R$968/ano
PREMIUM  (Business): 2.000 créditos — R$197/mês ou R$1.997/ano
PRO      (Agency):  10.000 créditos — R$497/mês ou R$4.997/ano

O saldo é reiniciado a cada ciclo de cobrança.`,
    relatedTopics: ["credits-what-are", "billing-plans", "credits-referral"],
  },
  {
    id: "credits-referral",
    category: "credits",
    topic: "Créditos por indicação",
    keywords: ["indicação", "referral", "indicar", "código", "bônus", "créditos extras", "ganhar créditos"],
    status: "active",
    content: `O sistema de indicação oferece créditos extras para ambas as partes:

Quem indica: recebe +50 créditos quando o indicado usa o código.
Quem é indicado: recebe +25 créditos ao ativar o código.

O código de indicação tem 8 caracteres (formato XXXX-XXXX) e é único por usuário.
O link de indicação pode ser copiado e compartilhado diretamente pela plataforma.
Os créditos de indicação são somados ao saldo atual, podendo ultrapassar o limite do plano.
Acesso: /dashboard/referral`,
    relatedTopics: ["credits-what-are", "workspace-referral"],
  },
];
