/**
 * semanticNormalize — camada de correção semântica compartilhada.
 * Aplicada em todos os inputs do usuário ANTES da montagem dos prompts.
 */

const PROTECTED_BRANDS: Record<string, string> = {
  iattom: "IAttom",
  protegnv: "PROTEGNV",
  hotmart: "Hotmart",
  shopee: "Shopee",
  kiwify: "Kiwify",
  tiktok: "TikTok",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  pinterest: "Pinterest",
  mercadolivre: "Mercado Livre",
};

const CORRECTIONS: Record<string, string> = {
  // Marketing / negócios
  markting: "marketing",
  marketng: "marketing",
  maketing: "marketing",
  markeitng: "marketing",
  mktg: "marketing",
  // Coach / coaching
  coalth: "coach",
  coch: "coach",
  cooach: "coach",
  // Empreendedor
  empreendor: "empreendedor",
  // Acento ausente — PT-BR frequentes
  caminhao: "caminhão",
  gestao: "gestão",
  educacao: "educação",
  nutricao: "nutrição",
  comunicacao: "comunicação",
  producao: "produção",
  negocio: "negócio",
  negocios: "negócios",
  lideranca: "liderança",
  informacao: "informação",
  criacao: "criação",
  solucao: "solução",
  solucoes: "soluções",
  atencao: "atenção",
  situacao: "situação",
  relacao: "relação",
  funcao: "função",
  operacao: "operação",
  conteudo: "conteúdo",
  estrategia: "estratégia",
  estrategias: "estratégias",
  trafego: "tráfego",
  anuncio: "anúncio",
  anuncios: "anúncios",
  configuracao: "configuração",
  integracao: "integração",
  // Marcas escritas errado → forma canônica
  hotmat: "Hotmart",
  hotmrat: "Hotmart",
  kiwfiy: "Kiwify",
  shope: "Shopee",
};

function correctWord(word: string): string {
  const lower = word.toLowerCase();
  const correction = CORRECTIONS[lower];
  if (correction !== undefined) return correction;
  const brand = PROTECTED_BRANDS[lower];
  if (brand !== undefined) return brand;
  return word;
}

/**
 * Corrige erros evidentes de digitação e ortografia no texto de entrada.
 * Preserva marcas e nomes comerciais com grafia intencional.
 *
 * Exemplos:
 *   "markting digital"  → "marketing digital"
 *   "coalth de vendas"  → "coach de vendas"
 *   "caminhao pesado"   → "caminhão pesado"
 *   "hotmat"            → "Hotmart"
 */
export function semanticNormalize(input: string): string {
  if (!input?.trim()) return input;
  return input.replace(/[A-Za-zÀ-ÿ]+/g, correctWord);
}

/**
 * Normaliza texto de hashtags: converte palavras separadas por espaço/vírgula/underline
 * em hashtags formatadas (minúsculas, sem acento, com prefixo #).
 *
 * Exemplos:
 *   "motivacao mentalidade alta_performance"  → "#motivacao #mentalidade #altaperformance"
 *   "#Motivação #Alta Performance"            → "#motivacao #altaperformance"
 */
export function normalizeHashtags(text: string): string {
  if (!text?.trim()) return text;
  return text
    .split(/[\s,;|]+/)
    .map((token) => token.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((token) =>
      "#" +
      token
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase(),
    )
    .filter((t) => t.length > 1)
    .join(" ");
}

/**
 * Normaliza hashtags encontradas inline em texto de post social.
 * Aplicada no output gerado pelo modelo para o campo "social".
 *
 * Exemplo:
 *   "Confira! #Motivação #Alta_Performance" → "Confira! #motivacao #altaperformance"
 */
export function normalizeHashtagsInOutput(text: string): string {
  if (!text?.trim()) return text;
  return text.replace(/#[\wÀ-ÿ_-]+/g, (match) => {
    const tag = match
      .slice(1)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[_\s-]/g, "")
      .toLowerCase();
    return `#${tag}`;
  });
}
