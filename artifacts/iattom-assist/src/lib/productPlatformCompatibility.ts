const PHYSICAL_PLATFORM_KEYWORDS = ["shopee", "mercado", "facebook", "instagram", "tiktok"];
const DIGITAL_PLATFORM_KEYWORDS = ["hotmart", "kiwify"];

// ─── Physical product keyword list ───────────────────────────────────────────
// Covers common physical goods in Portuguese. Text inference against this list
// takes precedence over the user-selected product type (prevents bypass).
const PHYSICAL_PRODUCT_TERMS = [
  // Veículos e mobilidade
  "scooter", "bicicleta", "moto", "carro", "patinete", "patins",
  // Eletrônicos e acessórios
  "celular", "smartphone", "tablet", "fone", "câmera", "câmara", "eletrônico",
  "carregador", "cabo", "capa", "suporte", "bateria", "teclado", "mouse",
  // Vestuário e moda
  "roupa", "camiseta", "camisa", "calça", "vestido", "blusa", "jaqueta",
  "casaco", "moletom", "shorts", "bermuda", "saia", "agasalho",
  "tênis", "sapato", "calçado", "sandália", "chinelo", "bota",
  "bolsa", "mochila", "carteira", "nécessaire", "mala",
  "relógio", "pulseira", "colar", "brinco", "anel", "broche", "bijuteria",
  // Beleza e cuidado pessoal
  "perfume", "cosmético", "creme", "óleo", "sérum", "loção", "shampoo",
  "condicionador", "skincare", "protetor solar", "batom", "maquiagem",
  // Saúde e suplementos
  "suplemento", "vitamina", "proteína", "whey", "creatina", "colágeno",
  "remédio", "medicamento",
  // Alimentos e bebidas
  "alimento", "comida", "bebida", "café", "chá", "suco", "chocolate",
  "biscoito", "doce", "snack", "tempero", "azeite",
  // Utensílios e casa
  "cadeira", "mesa", "sofá", "estante", "armário", "cama", "colchão",
  "garrafa", "copo", "caneca", "prato", "tigela", "panela", "forma",
  "pote", "frasco", "caixa", "embalagem", "sachê",
  "vela", "difusor", "porta-retrato", "quadro", "tapete", "almofada",
  // Ferramentas e materiais
  "ferramenta", "parafuso", "martelo", "chave", "serra", "furadeira",
  "peça", "componente", "equipamento", "aparelho", "dispositivo",
  "ferro", "madeira", "pedra", "cerâmica", "plástico", "tecido",
  // Brinquedos e infantil
  "brinquedo", "boneca", "carrinho", "lego", "jogo de tabuleiro", "puzzle",
  // Kits e conjuntos físicos
  "kit", "combo", "conjunto", "par",
  // Termos genéricos físicos
  "produto físico", "acessório", "item físico",
];

// ─── Digital product keyword list ────────────────────────────────────────────
const DIGITAL_PRODUCT_TERMS = [
  "curso", "ebook", "e-book", "livro digital",
  "mentoria", "consultoria", "coaching",
  "treinamento", "workshop", "masterclass",
  "aula", "aulas", "videoaula",
  "método", "metodologia", "sistema",
  "assinatura", "membership", "clube", "comunidade",
  "produto digital", "infoproduto", "info-produto",
  "planilha", "template", "modelo digital",
  "software", "saas", "aplicativo", "app", "ferramenta digital",
  "programa online", "bootcamp",
];

function isPlatformDigital(platform: string): boolean {
  const lower = platform.toLowerCase();
  return DIGITAL_PLATFORM_KEYWORDS.some((k) => lower.includes(k));
}

function isPlatformPhysical(platform: string): boolean {
  const lower = platform.toLowerCase();
  return PHYSICAL_PLATFORM_KEYWORDS.some((k) => lower.includes(k));
}

/**
 * Infers the product type from free-form product text.
 * Returns "físico", "digital", or null if ambiguous.
 * null means the text alone cannot determine the type — caller should use fallback.
 */
export function inferProductType(text: string): "físico" | "digital" | null {
  const lower = text.toLowerCase();
  const isPhysical = PHYSICAL_PRODUCT_TERMS.some((t) => lower.includes(t));
  const isDigital = DIGITAL_PRODUCT_TERMS.some((t) => lower.includes(t));
  if (isPhysical && !isDigital) return "físico";
  if (isDigital && !isPhysical) return "digital";
  return null;
}

/**
 * Determines the effective product type for platform compatibility checks.
 *
 * Priority order:
 * 1. Text inference (if unambiguous) → overrides selected type entirely
 * 2. Selected type === "Digital" → digital
 * 3. Selected type === "Serviço" → digital
 *    (services are compatible with digital platforms; known physical services
 *     are caught by text inference above, e.g. "pedra", "ferramenta")
 * 4. Everything else (Físico, empty, unknown) → físico (preventive default)
 *
 * This prevents bypass: a user who selects "Digital" while typing "Scooter"
 * or "Pedra" will still be blocked from Hotmart/Kiwify.
 */
export function getEffectiveProductType(
  productText: string,
  selectedType: string | null,
): "físico" | "digital" {
  const inferred = inferProductType(productText);
  if (inferred !== null) return inferred;

  const type = selectedType?.toLowerCase().trim() ?? "";
  if (type === "digital" || type === "serviço") return "digital";

  // Unknown, "Físico", or nothing selected → preventive physical default
  return "físico";
}

export type IncompatibilityType = "physical_on_digital" | "digital_on_physical" | null;

export function detectIncompatibility(
  productType: string | null,
  platform: string,
): IncompatibilityType {
  if (!productType || !platform) return null;
  const type = productType.toLowerCase();
  if (type === "físico") {
    if (isPlatformDigital(platform)) return "physical_on_digital";
  }
  if (type === "digital") {
    if (isPlatformPhysical(platform)) return "digital_on_physical";
  }
  return null;
}

export const INCOMPATIBILITY_MESSAGES: Record<NonNullable<IncompatibilityType>, string> = {
  physical_on_digital:
    "ATENÇÃO: O produto informado parece ser físico, mas a plataforma selecionada é voltada para produtos digitais. Use Mercado Livre, Shopee, Facebook, Instagram ou TikTok para produtos físicos.",
  digital_on_physical:
    "ATENÇÃO: O produto informado parece ser digital, mas a plataforma selecionada é voltada para produtos físicos. Use Hotmart ou Kiwify para produtos digitais.",
};
