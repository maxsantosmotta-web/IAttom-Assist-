import type { KnowledgeEntry } from "./index.js";

/**
 * Integration knowledge entries — structured facts, not response templates.
 *
 * Format rule: cada entry é uma coleção de fatos que o LLM usa para
 * raciocinar a partir da intenção do usuário, não um script pronto.
 * O LLM lê os fatos e monta a resposta adequada à pergunta real.
 */

export const integrations: KnowledgeEntry[] = [
  {
    id: "integration-hotmart",
    category: "integrations",
    topic: "Hotmart",
    keywords: [
      "hotmart",
      "integração hotmart",
      "produto digital hotmart",
      "curso hotmart",
      "infoproduto hotmart",
      "vender no hotmart",
      "para que serve hotmart",
      "finalidade hotmart",
      "como funciona hotmart",
      "o que a hotmart faz",
      "hotmart dentro do iattom",
      "preciso conectar hotmart",
      "vale a pena hotmart",
      "o que muda hotmart",
    ],
    status: "active",
    content: `HOTMART
Categoria: plataforma de distribuição e venda de infoprodutos — cursos, ebooks, mentorias, assinaturas digitais
Finalidade dentro do IAttom: preparar o material de venda antes de o usuário levar o produto para a Hotmart — oferta estruturada, copy, conteúdo e campanha
Posição no fluxo do usuário: decide/cria produto digital → usa o IAttom para preparar oferta e materiais → leva para a Hotmart e publica lá
Perfil de usuário típico: criador de conteúdo, infoprodutor, mentor, especialista ou afiliado que vende conhecimento e expertise online
Módulos IAttom relacionados: Criar Campanha (copy e estrutura de lançamento), Criar Conteúdo (materiais de divulgação e aquecimento)
Benefício de conectar ao IAttom: o output passa a usar linguagem de infoproduto — copy de lançamento, argumentos de conversão para público digital, estrutura de página de vendas, sequência de divulgação
Sem integração conectada: o IAttom ainda ajuda, mas com contexto genérico; os materiais não são adaptados ao mercado de infoprodutos e ao perfil do comprador da Hotmart
Com integração conectada: o IAttom usa o contexto do produto e da plataforma para adaptar copy, estrutura de oferta e materiais ao formato de venda digital da Hotmart
Limitação atual: IAttom não publica diretamente na Hotmart; atua na preparação do material, não na publicação`,
    relatedTopics: ["create-campaign", "journey-digital-product"],
  },
  {
    id: "integration-kiwify",
    category: "integrations",
    topic: "Kiwify",
    keywords: [
      "kiwify",
      "integração kiwify",
      "produto digital kiwify",
      "vender no kiwify",
      "para que serve kiwify",
      "finalidade kiwify",
      "como funciona kiwify",
      "o que a kiwify faz",
      "kiwify dentro do iattom",
      "preciso conectar kiwify",
      "vale a pena kiwify",
      "o que muda kiwify",
    ],
    status: "active",
    content: `KIWIFY
Categoria: plataforma de venda de produtos digitais — cursos, ebooks, comunidades, assinaturas
Finalidade dentro do IAttom: preparar a oferta e os materiais de venda antes de o usuário publicar o produto na Kiwify
Posição no fluxo do usuário: produto digital definido → IAttom estrutura a oferta e o material de divulgação → usuário publica na Kiwify
Perfil de usuário típico: produtor de conteúdo digital, creator, especialista, afiliado — especialmente quem está no começo e busca uma plataforma mais acessível que a Hotmart
Módulos IAttom relacionados: Criar Campanha, Criar Conteúdo
Diferença da Hotmart: a Kiwify tem público mais voltado a nichos menores e creators menores; os materiais de marketing do IAttom podem ser adaptados para esse público específico
Benefício de conectar ao IAttom: output adaptado ao contexto da Kiwify — linguagem mais direta, copy orientada a conversão para produtos de menor ticket ou nichos específicos
Sem integração: IAttom ainda ajuda, mas com contexto genérico; materiais não são adaptados ao perfil da Kiwify
Limitação atual: IAttom não publica diretamente na Kiwify; atua na preparação do material`,
    relatedTopics: ["create-campaign", "journey-digital-product"],
  },
  {
    id: "integration-mercado-livre",
    category: "integrations",
    topic: "Mercado Livre",
    keywords: [
      "mercado livre",
      "meli",
      "ml integração",
      "vender no mercado livre",
      "integração mercado livre",
      "marketplace mercado livre",
      "para que serve mercado livre",
      "finalidade mercado livre",
      "como funciona mercado livre",
      "o que o mercado livre faz",
      "mercado livre dentro do iattom",
      "anunciar no mercado livre",
      "preciso conectar mercado livre",
      "vale a pena mercado livre",
    ],
    status: "active",
    content: `MERCADO LIVRE
Categoria: marketplace de produtos físicos e digitais — maior do Brasil e da América Latina
Finalidade dentro do IAttom: preparar o anúncio, a descrição e os materiais de divulgação do produto antes de publicar no Mercado Livre
Posição no fluxo do usuário: produto escolhido/em mãos → IAttom prepara anúncio estruturado e materiais de atração → usuário publica no Mercado Livre
Perfil de usuário típico: revendedor, lojista, dropshipper ou quem quer vender produtos físicos em marketplace
Módulos IAttom relacionados: Criar Campanha (copy e anúncio), Criar Conteúdo (descrição de produto e materiais de atração)
Benefício de conectar ao IAttom: o output usa linguagem e estrutura de anúncio otimizada para marketplace — título, descrição, argumentos de compra, pontos de diferenciação e copy para atrair compradores buscando no ML
Sem integração: IAttom ainda cria copy, mas sem adaptar ao formato e às expectativas do comprador de marketplace
Com integração: output adaptado ao contexto de marketplace — destaque dos diferenciais do produto, copy voltada à decisão de compra rápida
Limitação atual: IAttom não publica o anúncio diretamente no Mercado Livre; atua na preparação do material`,
    relatedTopics: ["create-campaign", "journey-physical-product"],
  },
  {
    id: "integration-shopee",
    category: "integrations",
    topic: "Shopee",
    keywords: [
      "shopee",
      "integração shopee",
      "loja shopee",
      "vender na shopee",
      "para que serve shopee",
      "finalidade shopee",
      "como funciona shopee",
      "o que a shopee faz",
      "shopee dentro do iattom",
      "anunciar na shopee",
      "preciso conectar shopee",
      "vale a pena shopee",
    ],
    status: "active",
    content: `SHOPEE
Categoria: marketplace de produtos físicos com forte apelo a preço e volume — popular entre revendedores e dropshippers
Finalidade dentro do IAttom: preparar anúncio, descrição e materiais de atração antes de publicar na Shopee
Posição no fluxo do usuário: produto definido → IAttom cria anúncio, copy e conteúdo de atração → usuário publica na Shopee
Perfil de usuário típico: revendedor iniciante, dropshipper, quem quer começar a vender sem grande investimento inicial
Diferença do Mercado Livre: Shopee tem público mais sensível a preço e promoções; a comunicação tende a ser mais direta e voltada a custo-benefício
Módulos IAttom relacionados: Criar Campanha, Criar Conteúdo
Benefício de conectar ao IAttom: output adaptado ao estilo da Shopee — linguagem voltada a preço, promoção, copy de anúncio que converte na plataforma
Sem integração: IAttom ajuda com copy genérica; sem adaptação ao formato e ao perfil do comprador da Shopee
Limitação atual: IAttom não publica na Shopee; atua na preparação do material`,
    relatedTopics: ["create-campaign", "journey-physical-product"],
  },
  {
    id: "integration-tiktok",
    category: "integrations",
    topic: "TikTok",
    keywords: [
      "tiktok",
      "tik tok",
      "integração tiktok",
      "tiktok shop",
      "vídeo tiktok",
      "vender no tiktok",
      "para que serve tiktok",
      "finalidade tiktok",
      "como funciona tiktok",
      "o que o tiktok faz",
      "tiktok dentro do iattom",
      "conteúdo tiktok",
      "preciso conectar tiktok",
      "vale a pena tiktok",
    ],
    status: "active",
    content: `TIKTOK
Categoria: plataforma de vídeos curtos com alcance orgânico alto — usada para divulgação, branding e venda direta (TikTok Shop)
Finalidade dentro do IAttom: criar scripts de vídeo, copy de divulgação e ideias de conteúdo orientados a atrair compradores no TikTok
Posição no fluxo do usuário: produto ou oferta definidos → IAttom cria scripts e conteúdos de divulgação → usuário grava e publica no TikTok
Perfil de usuário típico: criadores que vendem produtos físicos ou digitais, lojistas que querem usar vídeo para vender, afiliados, infoprodutores
Módulos IAttom relacionados: Scripts de Vídeo (principal), Criar Campanha, Criar Conteúdo
Benefício de conectar ao IAttom: scripts e copy adaptados ao formato de vídeo curto do TikTok — gancho nos primeiros 3 segundos, ritmo de corte, CTA direto para compra ou perfil
Sem integração: IAttom cria scripts genéricos; com o contexto do TikTok, os scripts são adaptados à linguagem e ao comportamento do usuário da plataforma
Diferença de Instagram: TikTok tem alcance orgânico maior para contas novas; o ritmo e o formato do script são diferentes — mais direto, mais rápido
Limitação atual: IAttom não publica diretamente no TikTok; atua na preparação do conteúdo`,
    relatedTopics: ["create-campaign", "video-scripts"],
  },
  {
    id: "integration-facebook",
    category: "integrations",
    topic: "Facebook",
    keywords: [
      "facebook",
      "fb",
      "meta",
      "integração facebook",
      "facebook ads",
      "facebook business",
      "anúncio facebook",
      "campanha facebook",
      "para que serve facebook",
      "finalidade facebook",
      "como funciona facebook",
      "o que o facebook faz",
      "facebook dentro do iattom",
      "conectar facebook",
      "preciso conectar facebook",
      "vale a pena facebook",
    ],
    status: "active",
    content: `FACEBOOK
Categoria: plataforma de anúncios pagos e alcance orgânico — principalmente Facebook Ads e páginas de negócio
Finalidade dentro do IAttom: criar copy de anúncio, estrutura de campanha e texto de oferta adaptados para o Facebook e o Facebook Ads
Posição no fluxo do usuário: produto ou oferta definidos → IAttom prepara copy e estrutura do anúncio → usuário sobe a campanha no Facebook Ads Manager
Perfil de usuário típico: vendedor que usa tráfego pago, dono de negócio local ou digital que quer anunciar no Facebook, afiliados
Módulos IAttom relacionados: Criar Campanha (principal), Criar Conteúdo, Criar Imagem
Benefício de conectar ao IAttom: copy de anúncio adaptada ao formato do Facebook — headline, copy curta, copy longa, copy de carrossel, argumentos de conversão para o público do Facebook
Diferença do Instagram: Facebook tem público mais amplo e mais velho; a copy tende a ser mais explicativa e a imagem menos importante que o texto
Sem integração: IAttom gera copy genérica de campanha; com contexto do Facebook, adapta ao formato de anúncio e ao perfil do público da plataforma
Limitação atual: IAttom não sobe campanhas diretamente no Facebook Ads; atua na preparação do material`,
    relatedTopics: ["create-campaign"],
  },
  {
    id: "integration-instagram",
    category: "integrations",
    topic: "Instagram",
    keywords: [
      "instagram",
      "insta",
      "ig",
      "integração instagram",
      "reels",
      "stories",
      "feed instagram",
      "anúncio instagram",
      "campanha instagram",
      "para que serve instagram",
      "finalidade instagram",
      "como funciona instagram",
      "o que o instagram faz",
      "instagram dentro do iattom",
      "conectar instagram",
      "preciso conectar instagram",
      "vale a pena instagram",
    ],
    status: "active",
    content: `INSTAGRAM
Categoria: plataforma visual de conteúdo e anúncios — feed, stories, reels, Instagram Ads
Finalidade dentro do IAttom: criar legendas, textos de stories, roteiros de reels e copy de anúncio adaptados ao Instagram
Posição no fluxo do usuário: produto ou perfil definidos → IAttom cria conteúdo e copy → usuário publica no Instagram
Perfil de usuário típico: criadores de conteúdo, empreendedores com marca pessoal, lojistas com produto visual, afiliados, infoprodutores
Módulos IAttom relacionados: Criar Conteúdo (legendas, stories), Scripts de Vídeo (roteiros de reels), Criar Campanha (anúncios), Criar Imagem (criativos)
Benefício de conectar ao IAttom: output adaptado ao formato do Instagram — legendas com hook inicial, CTAs para stories, roteiros de reels com ritmo adequado, copy de anúncio visual
Diferença do Facebook: Instagram é mais visual; o texto apoia a imagem/vídeo, não substitui; o formato muda entre feed, stories e reels
Diferença do TikTok: Instagram tem alcance orgânico menor para contas novas, mas público mais engajado com marca; conteúdo tende a ser mais polido
Sem integração: IAttom cria conteúdo genérico; com contexto do Instagram, adapta ao formato e à linguagem de cada tipo de publicação
Limitação atual: IAttom não publica diretamente no Instagram; prepara o material`,
    relatedTopics: ["create-campaign", "create-content"],
  },
];
