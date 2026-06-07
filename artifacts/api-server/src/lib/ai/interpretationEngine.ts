/**
 * Motor de Interpretação e Especialistas — BLOCO 1.5
 *
 * Camada interna de refinamento de contexto.
 * Não gera conteúdo — apenas enriquece o contexto antes da IA.
 * Reutilizável em: Criativo, Campanha, Script, Vídeo.
 *
 * Fluxo: Usuário → Interpretação → Especialista → Prompt refinado → IA
 */

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type SpecialistKey = "marketplace" | "social" | "infoproduto" | "perfil" | "generic";

export interface ProductInterpretation {
  productName: string;
  category: string;
  productType: string;
  platform: string;
  objective: string;
}

export interface SpecialistContext {
  key: SpecialistKey;
  name: string;
  visualDirectives: string[];
  compositionGuidance: string;
  conversionFocus: string;
}

export interface RefinedContext {
  specialist: SpecialistKey;
  interpretation: ProductInterpretation;
  systemEnhancement: string;
  userEnhancement: string;
}

// ─── Biblioteca de Especialistas ────────────────────────────────────────────

const SPECIALISTS: Record<SpecialistKey, SpecialistContext> = {
  marketplace: {
    key: "marketplace",
    name: "Marketplace Specialist",
    visualDirectives: [
      "clean white or very light neutral background — catalog standard",
      "product clearly centered and dominant in frame — fills 70-80% of composition",
      "sharp, precise product edges with high contrast against background",
      "professional studio lighting: flat, soft-box or diffused — no harsh shadows",
      "catalog-quality product photography — no distracting props or textures",
      "conversion-focused composition — every element reinforces purchase intent",
      "photorealistic product representation — preserve exact shape and colors",
    ],
    compositionGuidance: "Marketplace catalog composition — product is the sole hero, clean and immediately identifiable at thumbnail scale",
    conversionFocus: "drive purchase decision through unambiguous product clarity, professional quality and visual trust",
  },

  social: {
    key: "social",
    name: "Social Specialist",
    visualDirectives: [
      "scroll-stopping visual impact — bold, magnetic, instantly arresting",
      "strong contrast or vivid color palette to interrupt scrolling behavior",
      "aspirational lifestyle context — product placed within an exciting, desirable environment",
      "cinematic or editorial quality — dramatic lighting, atmospheric depth",
      "dynamic composition with visual tension or movement to create energy",
      "premium brand aesthetic — the product elevates the viewer's perceived status",
      "natural eye-movement path through the frame — guides attention intentionally",
    ],
    compositionGuidance: "Social-first composition — visually magnetic within 0.5 seconds, brand premium, aspirational and shareable",
    conversionFocus: "generate engagement, saves and brand recall through immediate visual impact and aspirational lifestyle association",
  },

  infoproduto: {
    key: "infoproduto",
    name: "Infoproduto Specialist",
    visualDirectives: [
      "authoritative, expert-level visual treatment — conveys mastery and credibility",
      "premium digital product presentation — sleek, polished, high-end",
      "dark gradient backgrounds or deep tones that signal sophistication and expertise",
      "strong sense of value, quality and professional authority",
      "clean visual hierarchy — clear primary focal point with intentional negative space",
      "corporate or premium studio environment aesthetic",
      "trust signals through flawless professional execution",
    ],
    compositionGuidance: "Authority composition — positions the product as a premium, credible, high-value digital asset that demands respect",
    conversionFocus: "establish unwavering authority and deep trust to maximize conversion of digital products",
  },

  perfil: {
    key: "perfil",
    name: "Perfil Specialist",
    visualDirectives: [
      "clean centered subject — face, logo or brand symbol fully visible",
      "strong contrast against any background — legible at small sizes",
      "professional or on-brand lighting with no distracting elements",
      "minimal, uncluttered background — full attention on the subject",
      "crisp edges and sharp focal point — optimized for circular crop display",
    ],
    compositionGuidance: "Profile-optimized composition — instantly recognizable at thumbnail scale, centered, clean and impactful",
    conversionFocus: "establish identity, recognition and brand presence at any display size",
  },

  generic: {
    key: "generic",
    name: "Creative Specialist",
    visualDirectives: [
      "premium commercial photography quality",
      "professional lighting with natural depth",
      "clear visual hierarchy — product is the unmistakable hero",
      "clean, purposeful composition aligned with platform expectations",
    ],
    compositionGuidance: "Premium commercial composition — polished, professional and platform-appropriate",
    conversionFocus: "create a compelling, professional image that drives desired user action",
  },
};

// ─── Seleção de Especialista ─────────────────────────────────────────────────

function resolveSpecialist(platform: string): SpecialistContext {
  switch (platform) {
    case "mercado_livre":
    case "shopee":
      return SPECIALISTS.marketplace;

    case "instagram":
    case "facebook":
    case "tiktok":
      return SPECIALISTS.social;

    case "hotmart":
    case "kiwify":
      return SPECIALISTS.infoproduto;

    case "perfil":
      return SPECIALISTS.perfil;

    default:
      return SPECIALISTS.generic;
  }
}

// ─── Motor de Interpretação ──────────────────────────────────────────────────

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string; productType: string }> = [
  { pattern: /scooter|moto[^r]|bicicleta|veículo|veiculo|carro|automóvel|automovel|caminhonete/i, category: "Mobilidade", productType: "produto físico — veículo" },
  { pattern: /tênis|tenis|roupa|camiseta|calça|calca|vestido|moda|sapato|bolsa|acessório|acessorio|jaqueta|camisa/i, category: "Moda e Vestuário", productType: "produto físico — moda" },
  { pattern: /curso|ebook|e-book|treinamento|mentoria|consultoria|aula|workshop|formação|formacao|método|metodo/i, category: "Infoproduto", productType: "produto digital" },
  { pattern: /suplemento|proteína|proteina|vitamina|whey|creatina|saúde|saude|nutri/i, category: "Saúde e Nutrição", productType: "produto físico — saúde" },
  { pattern: /celular|smartphone|notebook|computador|eletrônico|eletronico|gadget|fone|tablet|monitor|teclado/i, category: "Tecnologia", productType: "produto físico — eletrônico" },
  { pattern: /cosmétic|cosmetico|maquiagem|creme|perfume|beleza|shampoo|condicionador|skincare|sérum|serum/i, category: "Beleza e Cosméticos", productType: "produto físico — beleza" },
  { pattern: /alimento|comida|bebida|café|cafe|chocolate|snack|lanche|refeição|refeicao|salgado|doce/i, category: "Alimentos e Bebidas", productType: "produto físico — alimento" },
  { pattern: /móvel|movel|sofá|sofa|mesa|cadeira|decoração|decoracao|casa|cozinha|quarto|sala|luminária|luminaria/i, category: "Casa e Decoração", productType: "produto físico — casa" },
  { pattern: /pet|animal|cachorro|gato|aquário|aquario|ração|racao|coleira/i, category: "Pet", productType: "produto para animais" },
  { pattern: /livro|book|manual|guia|apostila/i, category: "Editorial", productType: "produto físico ou digital — editorial" },
  { pattern: /service|serviço|servico|agência|agencia|consultori/i, category: "Serviços", productType: "serviço profissional" },
];

function interpretProduct(prompt: string, platform: string): ProductInterpretation {
  const lowerPrompt = prompt.toLowerCase();

  let category = "Produto";
  let productType = "produto físico";

  for (const entry of CATEGORY_PATTERNS) {
    if (entry.pattern.test(lowerPrompt)) {
      category = entry.category;
      productType = entry.productType;
      break;
    }
  }

  // Infoprodutos em plataformas de infoproduto override categorização genérica
  if (["hotmart", "kiwify"].includes(platform) && category === "Produto") {
    category = "Infoproduto";
    productType = "produto digital";
  }

  let objective = "gerar imagem comercial de alta qualidade";
  switch (platform) {
    case "mercado_livre":
    case "shopee":
      objective = "gerar imagem de catálogo profissional para marketplace — foco em conversão e clareza de produto";
      break;
    case "hotmart":
    case "kiwify":
      objective = "gerar capa ou banner de produto digital com autoridade, credibilidade e apelo de conversão";
      break;
    case "instagram":
    case "facebook":
      objective = "gerar criativo de alto impacto visual para rede social — foco em engajamento e parada de scroll";
      break;
    case "tiktok":
      objective = "gerar imagem dinâmica e de alto impacto para o ecossistema TikTok — jovem, bold, aspiracional";
      break;
    case "perfil":
      objective = "gerar imagem de perfil profissional ou identidade de marca";
      break;
  }

  return {
    productName: prompt.trim(),
    category,
    productType,
    platform,
    objective,
  };
}

// ─── Construção do Contexto Refinado ────────────────────────────────────────

/**
 * buildRefinedContext
 *
 * Ponto de entrada principal do Motor de Interpretação.
 * Recebe o prompt e a plataforma, retorna contexto enriquecido
 * pronto para injeção nos prompts da IA.
 *
 * @param prompt   - Produto ou descrição do usuário
 * @param platform - Plataforma selecionada (instagram, mercado_livre, etc.)
 */
export function buildRefinedContext(prompt: string, platform: string): RefinedContext {
  const interpretation = interpretProduct(prompt, platform);
  const specialist = resolveSpecialist(platform);

  const systemEnhancement = [
    `── MOTOR DE INTERPRETAÇÃO ──`,
    `PRODUTO: ${interpretation.productName}`,
    `CATEGORIA: ${interpretation.category}`,
    `TIPO: ${interpretation.productType}`,
    `OBJETIVO: ${interpretation.objective}`,
    ``,
    `── ESPECIALISTA ATIVO: ${specialist.name} ──`,
    `DIRETRIZES VISUAIS OBRIGATÓRIAS:`,
    ...specialist.visualDirectives.map((d) => `• ${d}`),
    ``,
    `COMPOSIÇÃO: ${specialist.compositionGuidance}`,
    `FOCO DE CONVERSÃO: ${specialist.conversionFocus}`,
  ].join("\n");

  const userEnhancement = [
    `Categoria identificada: ${interpretation.category} | Tipo: ${interpretation.productType}`,
    `Objetivo: ${interpretation.objective}`,
  ].join("\n");

  return {
    specialist: specialist.key,
    interpretation,
    systemEnhancement,
    userEnhancement,
  };
}
