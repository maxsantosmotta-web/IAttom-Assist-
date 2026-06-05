import type { KnowledgeEntry } from "./index.js";

export const integrations: KnowledgeEntry[] = [
  {
    id: "integration-mercado-livre",
    category: "integrations",
    topic: "Mercado Livre",
    keywords: ["mercado livre", "ml", "marketplace", "meli"],
    status: "active",
    content: `O módulo Mercado Livre exibe o status da integração, métricas de produtos e vendas.
Possui botões funcionais para ações como criar campanha com contexto da plataforma pré-preenchido.
Webhook disponível para exibição e cópia.
Limitação atual: isolamento completo de dados por usuário está registrado como pendência no roadmap.
OAuth real (login com conta Mercado Livre) está no roadmap e ainda não está disponível.
Rota: /dashboard/mercado-livre`,
    relatedTopics: ["create-campaign", "roadmap-oauth"],
  },
  {
    id: "integration-shopee",
    category: "integrations",
    topic: "Shopee",
    keywords: ["shopee", "marketplace shopee"],
    status: "active",
    content: `O módulo Shopee exibe status da integração, métricas, produtos e vendas.
Possui botão "Criar Campanha" com contexto da plataforma pré-preenchido automaticamente.
Webhook disponível para exibição e cópia.
OAuth real (login com conta Shopee) está no roadmap e ainda não está disponível.
Rota: /dashboard/shopee`,
    relatedTopics: ["create-campaign", "roadmap-oauth"],
  },
  {
    id: "integration-tiktok",
    category: "integrations",
    topic: "TikTok",
    keywords: ["tiktok", "tik tok", "vídeo curto", "short video"],
    status: "active",
    content: `O módulo TikTok exibe status da integração, KPIs, posts e eventos.
Possui botão "Criar Campanha" com contexto TikTok pré-preenchido.
Webhook disponível.
OAuth real está no roadmap e ainda não está disponível.
Rota: /dashboard/tiktok`,
    relatedTopics: ["create-campaign", "video-scripts", "roadmap-oauth"],
  },
  {
    id: "integration-hotmart",
    category: "integrations",
    topic: "Hotmart",
    keywords: ["hotmart", "produto digital", "infoproduto", "curso online", "hotmart producer"],
    status: "active",
    content: `O módulo Hotmart exibe status da integração, produtos digitais e métricas de vendas.
Possui botão "Criar Campanha" com contexto Hotmart pré-preenchido.
Webhook disponível.
OAuth real está no roadmap e ainda não está disponível.
Rota: /dashboard/hotmart`,
    relatedTopics: ["create-campaign", "roadmap-oauth"],
  },
  {
    id: "integration-kiwify",
    category: "integrations",
    topic: "Kiwify",
    keywords: ["kiwify", "produto digital kiwify", "infoproduto kiwify"],
    status: "active",
    content: `O módulo Kiwify exibe status da integração, produtos e métricas.
Possui botão "Criar Campanha" com contexto Kiwify pré-preenchido.
Webhook disponível.
OAuth real está no roadmap e ainda não está disponível.
Rota: /dashboard/kiwify`,
    relatedTopics: ["create-campaign", "roadmap-oauth"],
  },
  {
    id: "integration-facebook",
    category: "integrations",
    topic: "Facebook",
    keywords: ["facebook", "fb", "meta", "facebook ads", "facebook business"],
    status: "active",
    content: `O módulo Facebook exibe status da integração e métricas de campanha.
Possui botão "Criar Campanha" com contexto Facebook pré-preenchido.
OAuth real (login com conta Facebook Business) está no roadmap e ainda não está disponível.
Rota: /dashboard/facebook`,
    relatedTopics: ["create-campaign", "roadmap-oauth"],
  },
  {
    id: "integration-instagram",
    category: "integrations",
    topic: "Instagram",
    keywords: ["instagram", "insta", "ig", "reels", "stories instagram"],
    status: "active",
    content: `O módulo Instagram exibe status da integração, posts e métricas de engajamento.
Possui botão "Criar Campanha" com contexto Instagram pré-preenchido.
OAuth real está no roadmap e ainda não está disponível.
Rota: /dashboard/instagram`,
    relatedTopics: ["create-campaign", "create-content", "roadmap-oauth"],
  },
];
