import type { KnowledgeEntry } from "./index.js";

export const modules: KnowledgeEntry[] = [
  {
    id: "find-products",
    category: "modules",
    topic: "Buscar Produtos",
    keywords: ["buscar produtos", "buscar", "produto", "descoberta", "oportunidade", "nicho", "find products", "pesquisar produto"],
    status: "active",
    content: `O módulo Buscar Produtos usa IA para identificar oportunidades de produtos com potencial de mercado.
O usuário descreve o nicho ou contexto e a IA retorna sugestões estruturadas com análise de viabilidade, demanda, margem, tendência e público-alvo.
Os resultados chegam em tempo real via streaming.
Custo: 5 créditos por uso.
Rota: /dashboard/find-products
Recomendação: após encontrar produtos, use o módulo Validar Produtos para confirmar o potencial antes de avançar para campanha.`,
    relatedTopics: ["validate-products", "create-campaign", "credits-feature-costs"],
  },
  {
    id: "validate-products",
    category: "modules",
    topic: "Validar Produtos",
    keywords: ["validar produto", "validar", "validação", "potencial", "viabilidade", "análise de produto", "validate"],
    status: "active",
    content: `O módulo Validar Produtos analisa um produto específico para determinar seu potencial comercial.
A IA avalia concorrência, demanda, diferenciais e viabilidade para o mercado brasileiro.
Complementa o Buscar Produtos: use Buscar para descobrir, Validar para confirmar antes de investir em campanha.
Custo: 5 créditos por uso.
Rota: /dashboard/validate-products`,
    relatedTopics: ["find-products", "create-campaign", "credits-feature-costs"],
  },
  {
    id: "create-campaign",
    category: "modules",
    topic: "Criar Campanha",
    keywords: ["criar campanha", "campanha", "anúncio", "copy", "copywriting", "estratégia", "campanha de marketing", "create campaign"],
    status: "active",
    content: `O módulo Criar Campanha gera campanhas completas com copywriting, estrutura de anúncio e estratégia de marketing.
Aceita contexto de plataforma: ao clicar em "Criar Campanha" dentro de uma integração (Shopee, TikTok, Mercado Livre etc.), o contexto do produto e da plataforma é pré-preenchido automaticamente.
Blocos individuais da campanha podem ser refinados separadamente após a geração inicial.
Os resultados chegam em tempo real via streaming.
Custo: 10 créditos por uso.
Rota: /dashboard/create-campaign`,
    relatedTopics: ["create-content", "video-scripts", "credits-feature-costs"],
  },
  {
    id: "create-content",
    category: "modules",
    topic: "Criar Conteúdo",
    keywords: ["criar conteúdo", "conteúdo", "post", "texto", "descrição", "email", "stories", "legenda", "create content"],
    status: "active",
    content: `O módulo Criar Conteúdo gera textos para posts, descrições de produtos, e-mails, stories e outros formatos de conteúdo.
O usuário informa o objetivo, tom e plataforma de destino e a IA gera o texto adequado.
Os resultados chegam em tempo real via streaming.
Custo: 8 créditos por uso.
Rota: /dashboard/create-content`,
    relatedTopics: ["create-campaign", "credits-feature-costs"],
  },
  {
    id: "creative-generator",
    category: "modules",
    topic: "Gerador Criativo",
    keywords: ["gerador criativo", "criar imagem", "imagem", "criativo", "visual", "design", "arte", "criação visual", "creative generator"],
    status: "active",
    content: `O módulo Gerador Criativo gera ideias criativas e conceitos visuais para campanhas e anúncios.
É o módulo com maior custo em créditos — focado em geração criativa premium.
Nota: na interface o módulo aparece como "Gerador Criativo". A renomeação para "Criar Imagem" está registrada no roadmap e será aplicada em versão futura.
Custo: 15 créditos por uso.
Rota: /dashboard/creative-generator`,
    relatedTopics: ["create-campaign", "credits-feature-costs", "roadmap-video-evolution"],
  },
  {
    id: "video-scripts",
    category: "modules",
    topic: "Scripts de Vídeo",
    keywords: ["scripts de vídeo", "roteiro", "script", "vídeo", "reels", "tiktok", "conteúdo em vídeo", "video script"],
    status: "active",
    content: `O módulo Scripts de Vídeo gera roteiros estruturados para vídeos de vendas, reels, TikToks e conteúdo em vídeo.
A IA estrutura o script com gancho de abertura, desenvolvimento e chamada para ação (CTA).
Os resultados chegam em tempo real via streaming.
Custo: 10 créditos por uso.
Rota: /dashboard/video-scripts`,
    relatedTopics: ["create-campaign", "credits-feature-costs", "roadmap-video-evolution"],
  },
];
