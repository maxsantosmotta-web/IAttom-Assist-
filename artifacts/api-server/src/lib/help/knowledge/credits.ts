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
O IAttom Help NÃO consome créditos — usa limite próprio de mensagens por plano.`,
    relatedTopics: ["credits-feature-costs", "credits-plans", "credits-referral"],
  },
  {
    id: "credits-feature-costs",
    category: "credits",
    topic: "Custo de créditos por módulo",
    keywords: ["custo", "quanto custa", "gasta", "créditos por uso", "preço em créditos", "consumo", "quanto consome"],
    status: "active",
    content: `Custo de créditos por módulo de IA:

Buscar Produtos:     5 créditos por uso
Validar Produtos:    5 créditos por uso
Criar Campanha:     10 créditos por uso
Criar Conteúdo:      8 créditos por uso
Criar Imagem — 1x: 10 créditos por uso
Criar Imagem — 2x: 15 créditos por uso
Criar Imagem — 3x: 20 créditos por uso
Scripts de Vídeo:   10 créditos por uso

Gerar Vídeo: NÃO consome créditos internos — usa saldo próprio de vídeos (PACK 5 / PACK 7 / PACK 10).
IAttom Help: NÃO consome créditos — usa limite de mensagens por plano.`,
    relatedTopics: ["credits-what-are", "credits-plans", "help-limits"],
  },
  {
    id: "credits-plans",
    category: "credits",
    topic: "Créditos e limites por plano",
    keywords: ["plano", "limite de créditos", "créditos do plano", "quantos créditos", "plano free", "plano pro", "start", "premium", "free"],
    status: "active",
    content: `Créditos de IA incluídos por plano (ciclo mensal):

FREE    :     0 créditos — sem acesso aos módulos de IA
START   :   700 créditos — R$69/mês
PREMIUM : 1.500 créditos — R$159/mês
PRO     : 3.250 créditos — R$299/mês

O saldo é reiniciado a cada ciclo de cobrança.
Créditos de indicação (+50 quem indica / +25 indicado) somam ao saldo e não expiram.`,
    relatedTopics: ["credits-what-are", "billing-plans", "credits-referral", "help-limits"],
  },
  {
    id: "credits-video",
    category: "credits",
    topic: "Vídeo — saldo próprio, não consome créditos",
    keywords: ["vídeo", "gerar vídeo", "saldo de vídeo", "pack vídeo", "pack 5", "pack 7", "pack 10", "vídeo não consome", "crédito vídeo"],
    status: "active",
    content: `A geração de vídeo no IAttom Assist funciona com saldo próprio — completamente separado dos créditos internos.

REGRA OFICIAL:
— Vídeo NÃO consome créditos internos do IAttom.
— Cada geração de vídeo desconta 1 unidade do saldo de vídeos.
— O saldo de vídeos é comprado separadamente via pacotes avulsos.

PACOTES DE VÍDEO:
— PACK 5:   5 vídeos
— PACK 7:   7 vídeos
— PACK 10: 10 vídeos

Scripts de Vídeo (módulo de roteiro de texto) — esse SIM consome 10 créditos internos.
Gerar Vídeo (módulo de geração visual com avatar) — esse NÃO consome créditos.`,
    relatedTopics: ["credits-feature-costs", "billing-packages"],
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
  {
    id: "help-limits",
    category: "credits",
    topic: "IAttom Help — limite de mensagens por plano",
    keywords: ["help", "mensagem", "mensagens", "limite do help", "iattom help", "bloqueado", "atingiu limite", "quantas mensagens", "help grátis", "help free"],
    status: "active",
    content: `O IAttom Help possui limite de mensagens por ciclo, definido pelo plano:

FREE    :   0 mensagens — sem acesso ao IAttom Help
START   : 200 mensagens por ciclo
PREMIUM : 350 mensagens por ciclo
PRO     : 700 mensagens por ciclo

O contador de mensagens é visível no próprio painel do IAttom Help.
Ao atingir o limite, novas mensagens ficam bloqueadas até a renovação do ciclo ou upgrade de plano.
O Help NÃO consome créditos internos — o limite é independente do saldo de créditos.`,
    relatedTopics: ["billing-plans", "credits-what-are"],
  },
];
