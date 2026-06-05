import type { KnowledgeEntry } from "./index.js";

export const journeys: KnowledgeEntry[] = [
  {
    id: "journey-earn-money",
    category: "journeys",
    topic: "Jornada: Como ganhar dinheiro com o IAttom",
    keywords: [
      "ganhar dinheiro",
      "renda extra",
      "renda online",
      "monetizar",
      "monetização",
      "como ganhar",
      "o que vender",
      "começar a vender",
      "vender online",
      "quero vender",
      "faturar",
      "lucrar",
      "gerar renda",
      "gerar lucro",
      "trabalhar online",
      "empreender",
      "afiliado",
      "afiliados",
    ],
    status: "active",
    content: `O IAttom Assist oferece múltiplos caminhos para gerar renda — a escolha do caminho depende do que você já tem e do que quer fazer.

CAMINHOS DISPONÍVEIS DENTRO DO IATTOM:

1. Produto físico em marketplace (Mercado Livre, Shopee):
Descobrir produto → Validar oportunidade → Criar Campanha → Criar Imagem → Publicar na plataforma.
Módulos envolvidos: Buscar Produtos, Validar Produto, Criar Campanha, Gerador Criativo.
Integrações: Mercado Livre, Shopee.

2. Produto digital (curso, eBook, infoproduto):
Criar conteúdo do produto → Script de apresentação/vendas → Campanha → Distribuir via Hotmart ou Kiwify.
Módulos envolvidos: Criar Conteúdo, Scripts de Vídeo, Criar Campanha, Gerador Criativo.
Integrações: Hotmart, Kiwify.

3. Afiliado (vender produto de terceiros com comissão):
Encontrar produto com potencial → Criar campanha para o produto → Gerar conteúdo e criativos → Publicar nos canais.
Módulos envolvidos: Buscar Produtos, Validar Produto, Criar Campanha, Criar Conteúdo, Gerador Criativo.
Nota: OAuth real com plataformas de afiliados está no roadmap.

4. Conteúdo pago em redes sociais:
Criar conteúdo para TikTok, Instagram, Facebook → Criar scripts para vídeos → Criar criativos → Campanhas pagas.
Módulos envolvidos: Criar Conteúdo, Scripts de Vídeo, Gerador Criativo, Criar Campanha.
Integrações: TikTok, Instagram, Facebook.

Todos os resultados podem ser salvos em Projetos Salvos para organizar cada iniciativa separadamente.`,
    relatedTopics: [
      "find-products",
      "validate-products",
      "create-campaign",
      "create-content",
      "video-scripts",
      "creative-generator",
      "workspace-projects",
    ],
  },
  {
    id: "journey-physical-product",
    category: "journeys",
    topic: "Jornada: Vender produto físico em marketplace",
    keywords: [
      "produto físico",
      "vender produto físico",
      "marketplace",
      "vender em marketplace",
      "shopee produto físico",
      "mercado livre produto",
      "produto para revender",
      "revenda",
      "estoque",
      "vender na shopee",
      "vender no mercado livre",
      "produto",
      "loja online",
    ],
    status: "active",
    content: `Para vender produto físico usando o IAttom Assist, o caminho recomendado conecta descoberta, validação, campanha e publicação nas plataformas.

FLUXO COMPLETO:

Etapa 1 — Descoberta:
Use Buscar Produtos para identificar produtos com potencial de mercado. Informe o nicho ou contexto e a IA retorna sugestões com análise de demanda, margem e tendência.

Etapa 2 — Validação:
Use Validar Produto para confirmar o potencial do produto escolhido antes de investir. A IA analisa concorrência, diferencial e viabilidade.

Etapa 3 — Campanha:
Use Criar Campanha para gerar a campanha do produto. Se você acessar o botão Criar Campanha dentro das integrações Mercado Livre ou Shopee, o contexto da plataforma e do produto é pré-carregado automaticamente.

Etapa 4 — Criativo:
Use Gerador Criativo para ideias visuais e conceitos de imagem para o anúncio.

Etapa 5 — Publicação:
Utilize a campanha gerada nas integrações Mercado Livre ou Shopee disponíveis no menu.

Etapa 6 — Organização:
Salve tudo em Projetos Salvos para manter o histórico e reutilizar em futuras campanhas.`,
    relatedTopics: [
      "find-products",
      "validate-products",
      "integration-mercado-livre",
      "integration-shopee",
      "create-campaign",
      "creative-generator",
      "workspace-projects",
    ],
  },
  {
    id: "journey-digital-product",
    category: "journeys",
    topic: "Jornada: Vender produto digital",
    keywords: [
      "produto digital",
      "vender produto digital",
      "infoproduto",
      "vender infoproduto",
      "produto online",
      "venda digital",
      "hotmart",
      "kiwify",
      "lançamento digital",
      "lançamento",
      "perpétuo",
    ],
    status: "active",
    content: `Para lançar e vender um produto digital usando o IAttom Assist, o fluxo conecta criação de conteúdo, campanha, scripts e as integrações com plataformas de produto digital.

FLUXO COMPLETO:

Etapa 1 — Estrutura do produto:
Use Criar Conteúdo para redigir textos do produto (descrição, módulos, promessa, benefícios).
Use Scripts de Vídeo para criar o roteiro de apresentação ou aula demonstrativa.

Etapa 2 — Campanha de lançamento:
Use Criar Campanha para gerar a campanha completa com copy, headline e estrutura de anúncio.

Etapa 3 — Criativo:
Use Gerador Criativo para ideias visuais de banner, capa e materiais de divulgação.

Etapa 4 — Plataforma de venda:
Integre com Hotmart ou Kiwify — ambas disponíveis no menu. Dentro de cada integração, o botão Criar Campanha pré-carrega o contexto da plataforma automaticamente.

Etapa 5 — Redes sociais:
Use TikTok, Instagram ou Facebook dentro do IAttom para criar campanhas de divulgação com contexto de cada plataforma.

Etapa 6 — Organização:
Salve todos os assets gerados em Projetos Salvos.`,
    relatedTopics: [
      "integration-hotmart",
      "integration-kiwify",
      "create-campaign",
      "create-content",
      "video-scripts",
      "creative-generator",
      "workspace-projects",
    ],
  },
  {
    id: "journey-ebook",
    category: "journeys",
    topic: "Jornada: Criar e vender um eBook",
    keywords: [
      "ebook",
      "e-book",
      "livro digital",
      "criar ebook",
      "criar e-book",
      "escrever ebook",
      "escrever livro",
      "vender ebook",
      "publicar ebook",
      "livro online",
    ],
    status: "active",
    content: `O IAttom Assist pode apoiar a criação e o lançamento de um eBook usando os módulos disponíveis — mesmo que a criação direta de eBooks ainda não seja uma funcionalidade nativa da plataforma.

O QUE O IATTOM PODE FAZER HOJE:

Etapa 1 — Estrutura e conteúdo:
Use Criar Conteúdo para redigir cada parte do eBook: introdução, capítulos, conclusão, chamadas de ação. Informe o tema, público e tom desejado.

Etapa 2 — Roteiro de apresentação:
Use Scripts de Vídeo para criar o roteiro de um vídeo de apresentação ou lançamento do eBook.

Etapa 3 — Copy de venda:
Use Criar Campanha para gerar a copy de vendas do eBook: headline, promessa, benefícios, prova social e CTA.

Etapa 4 — Criativo visual:
Use Gerador Criativo para ideias de capa, banner e materiais de divulgação.

Etapa 5 — Distribuição:
Venda o eBook via Hotmart ou Kiwify. Dentro de cada integração no IAttom, use Criar Campanha com contexto pré-carregado da plataforma.

Etapa 6 — Organização:
Salve toda a produção em Projetos Salvos para manter o material organizado e reutilizável.

NOTA: Funcionalidades avançadas como criação nativa de eBook e publicação assistida estão no roadmap aprovado para versões futuras.`,
    relatedTopics: [
      "create-content",
      "creative-generator",
      "create-campaign",
      "video-scripts",
      "integration-hotmart",
      "integration-kiwify",
      "workspace-projects",
    ],
  },
  {
    id: "journey-course",
    category: "journeys",
    topic: "Jornada: Criar e vender um curso online",
    keywords: [
      "curso",
      "curso online",
      "criar curso",
      "vender curso",
      "fazer curso",
      "aula",
      "aulas",
      "treinamento",
      "mentoria",
      "lançar curso",
      "plataforma de curso",
    ],
    status: "active",
    content: `O IAttom Assist apoia a criação e o lançamento de um curso online combinando os módulos de IA com as integrações de plataformas de produto digital.

FLUXO COMPLETO:

Etapa 1 — Estrutura do curso:
Use Criar Conteúdo para estruturar os módulos, aulas, objetivos e material de apoio do curso. Informe o tema, público e nível do conteúdo.

Etapa 2 — Roteiros das aulas:
Use Scripts de Vídeo para criar roteiros de aulas individuais, vídeos de apresentação e aulas demonstrativas.

Etapa 3 — Campanha de lançamento:
Use Criar Campanha para gerar a campanha completa de lançamento: copy de vendas, headline, oferta, prova social e CTA.

Etapa 4 — Criativo:
Use Gerador Criativo para materiais visuais de divulgação: banner do curso, capa, materiais de stories e feed.

Etapa 5 — Plataforma de venda:
Distribua o curso via Hotmart ou Kiwify — ambas disponíveis no menu. Use o botão Criar Campanha dentro de cada integração para campanhas com contexto da plataforma pré-carregado.

Etapa 6 — Divulgação em redes sociais:
Use TikTok, Instagram e Facebook dentro do IAttom para criar campanhas de divulgação específicas para cada plataforma.

Etapa 7 — Organização:
Salve toda a produção em Projetos Salvos.`,
    relatedTopics: [
      "video-scripts",
      "create-content",
      "create-campaign",
      "integration-hotmart",
      "integration-kiwify",
      "creative-generator",
      "workspace-projects",
    ],
  },
  {
    id: "journey-full-campaign",
    category: "journeys",
    topic: "Jornada: Criar uma campanha completa",
    keywords: [
      "campanha completa",
      "criar campanha completa",
      "campanha do zero",
      "estratégia completa",
      "campanha de marketing",
      "lançamento",
      "funil",
      "funil de vendas",
      "campanha de anúncio",
      "anúncios",
      "estrutura de campanha",
      "montar campanha",
    ],
    status: "active",
    content: `Para criar uma campanha completa usando o IAttom Assist, o fluxo conecta descoberta, campanha, conteúdo, criativo e scripts em sequência.

FLUXO DE CAMPANHA COMPLETA:

Etapa 1 — Produto e nicho (se ainda não definido):
Use Buscar Produtos para descobrir oportunidades ou Validar Produto para confirmar o potencial do que já tem.

Etapa 2 — Campanha:
Use Criar Campanha como núcleo da campanha. Informe o produto, público, promessa e plataforma de destino.
O módulo gera headline, copy, estrutura de anúncio e chamada para ação.
Se acessar Criar Campanha dentro de uma integração (Shopee, TikTok, ML etc.), o contexto da plataforma é pré-carregado.

Etapa 3 — Conteúdo de apoio:
Use Criar Conteúdo para textos de suporte: descrições, posts, e-mails de seguimento, stories.

Etapa 4 — Criativo visual:
Use Gerador Criativo para conceitos de imagem, banner e materiais visuais do anúncio.

Etapa 5 — Scripts de vídeo:
Use Scripts de Vídeo para criar roteiros de anúncio em vídeo, reels de divulgação e TikToks.

Etapa 6 — Publicação:
Utilize as integrações (TikTok, Instagram, Facebook, Shopee, ML) para publicar com contexto correto de cada plataforma.

Etapa 7 — Salvar:
Salve o projeto completo em Projetos Salvos para reutilizar e ajustar nas próximas rodadas.`,
    relatedTopics: [
      "create-campaign",
      "create-content",
      "creative-generator",
      "video-scripts",
      "find-products",
      "workspace-projects",
    ],
  },
  {
    id: "journey-grow-business",
    category: "journeys",
    topic: "Jornada: Melhorar e crescer o negócio",
    keywords: [
      "melhorar negócio",
      "crescer negócio",
      "escalar",
      "vender mais",
      "crescimento",
      "melhorar resultados",
      "otimizar",
      "aumentar vendas",
      "mais clientes",
      "estratégia de crescimento",
      "negócio",
      "negócios",
      "empreendimento",
      "como melhorar",
    ],
    status: "active",
    content: `Para crescer ou melhorar um negócio existente com o IAttom Assist, o foco está em identificar onde está o gargalo e usar os módulos corretos para cada frente.

ANÁLISE DO PONTO DE PARTIDA:

Não está vendendo o suficiente?
→ Revise o produto com Validar Produto → melhore a campanha com Criar Campanha → teste novos criativos com Gerador Criativo.

Não está aparecendo para o público certo?
→ Melhore a copy com Criar Campanha → crie conteúdo de posicionamento com Criar Conteúdo → ajuste a presença em TikTok, Instagram e Facebook.

Não sabe o que vender?
→ Explore Buscar Produtos para encontrar oportunidades de produto com potencial de demanda.

Quer diversificar canais?
→ Explore as integrações disponíveis: Mercado Livre, Shopee (físico), Hotmart, Kiwify (digital), TikTok, Instagram, Facebook (redes sociais).

Quer criar conteúdo com mais consistência?
→ Criar Conteúdo + Scripts de Vídeo + Gerador Criativo trabalhando em conjunto — salve os resultados em Projetos Salvos para manter organização.

ABORDAGEM RECOMENDADA:
Diagnosticar o gargalo → escolher o módulo correspondente → gerar → salvar → iterar com os resultados.`,
    relatedTopics: [
      "find-products",
      "validate-products",
      "create-campaign",
      "create-content",
      "workspace-analytics",
      "workspace-projects",
    ],
  },
];
