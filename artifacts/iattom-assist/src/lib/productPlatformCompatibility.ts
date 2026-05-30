const PHYSICAL_PLATFORM_KEYWORDS = ["shopee", "mercado", "facebook", "instagram", "tiktok"];
const DIGITAL_PLATFORM_KEYWORDS = ["hotmart", "kiwify"];

const PHYSICAL_PRODUCT_TERMS = [
  "scooter", "cadeira", "relógio", "celular", "roupa", "tênis", "sapato",
  "bolsa", "perfume", "eletrônico", "fone", "câmera", "bicicleta", "moto",
  "carro", "produto físico", "acessório", "equipamento",
];

const DIGITAL_PRODUCT_TERMS = [
  "curso", "ebook", "e-book", "mentoria", "consultoria", "treinamento",
  "aula", "método", "assinatura", "comunidade", "produto digital", "planilha",
  "template", "software", "saas", "ferramenta digital",
];

function isPlatformDigital(platform: string): boolean {
  const lower = platform.toLowerCase();
  return DIGITAL_PLATFORM_KEYWORDS.some((k) => lower.includes(k));
}

function isPlatformPhysical(platform: string): boolean {
  const lower = platform.toLowerCase();
  return PHYSICAL_PLATFORM_KEYWORDS.some((k) => lower.includes(k));
}

export function inferProductType(text: string): "físico" | "digital" | null {
  const lower = text.toLowerCase();
  const isPhysical = PHYSICAL_PRODUCT_TERMS.some((t) => lower.includes(t));
  const isDigital = DIGITAL_PRODUCT_TERMS.some((t) => lower.includes(t));
  if (isPhysical && !isDigital) return "físico";
  if (isDigital && !isPhysical) return "digital";
  return null;
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
    "ATENÇÃO: Produto físico incompatível com a plataforma selecionada. Hotmart e Kiwify são voltadas principalmente para produtos digitais.",
  digital_on_physical:
    "ATENÇÃO: Produto digital incompatível com a plataforma selecionada. Para produtos digitais, use Hotmart ou Kiwify.",
};
