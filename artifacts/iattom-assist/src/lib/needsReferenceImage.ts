/**
 * Detects whether a product description suggests a specific physical product
 * that would benefit from a reference image for accurate visual generation.
 *
 * Returns true for: model codes, commercial SKUs, distinctive physical products.
 * Returns false for: generic categories, services, digital products, food, cosmetics.
 */
function wordMatch(text: string, word: string): boolean {
  return new RegExp(`(^|\\s)${word}(\\s|$)`, "i").test(text);
}

export function needsReferenceImage(prompt: string, product?: string): boolean {
  const text = [product, prompt].filter(Boolean).join(" ").toLowerCase().trim();
  if (text.length < 2) return false;

  // Rule 1: Alphanumeric model codes — strongest signal
  // Matches: X11, RS-200, GTX1080, Note 20, Air Max 97, DX Racer 7, P40 Pro
  if (
    /\b[a-z]{1,6}\d{2,}\b/i.test(text) ||       // letters then digits: X11, GTX1080
    /\b[a-z]{1,6}-\d{2,}\b/i.test(text) ||      // letters-digits: RS-200
    /\b\d{2,}[a-z]{1,6}\b/i.test(text) ||       // digits then letters: 200X
    /\b[a-zA-Z]{2,}\s\d{2,}\b/.test(text)        // word space digits: Note 20, Air Max 97
  ) {
    return true;
  }

  // Rule 2: Physical products with highly specific visual identity (multi-word first)
  const phrases = [
    "cadeira gamer",
    "cadeira ergonômica",
    "fone de ouvido",
    "fone bluetooth",
    "relógio inteligente",
    "teclado mecânico",
    "mouse gamer",
    "action figure",
    "funko pop",
    "óculos de sol",
    "óculos esportivo",
    "nintendo switch",
  ];
  for (const phrase of phrases) {
    if (text.includes(phrase)) return true;
  }

  // Rule 3: Single-word physical categories (word-boundary aware)
  const words = [
    "scooter",
    "patinete",
    "moto",          // uses wordMatch — won't hit "motorola", "motivação"
    "motocicleta",
    "bicicleta",
    "capacete",
    "sneaker",
    "calçado",
    "notebook",
    "laptop",
    "câmera",
    "drone",
    "headset",
    "smartwatch",
    "playstation",
    "xbox",
  ];
  for (const word of words) {
    if (wordMatch(text, word)) return true;
  }

  // Rule 4: Accented words — use simple includes (wordMatch regex unreliable with ê, ã etc.)
  if (text.includes("tênis") || text.includes("sapato")) return true;

  return false;
}
