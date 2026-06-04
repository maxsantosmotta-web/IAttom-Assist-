export const ACTION_LABELS: Record<string, string> = {
  "Campaign created": "Campanha criada",
  "Generated content": "Conteúdo gerado",
  "Updated project": "Projeto atualizado",
  "Created project": "Projeto criado",
  "Completed project": "Projeto concluído",
  "Ran product validation": "Validação de produto executada",
  "Product discovery": "Descoberta de produto",
  "Created campaign": "Campanha criada",
  "Content generated": "Conteúdo gerado",
  "Video script generated": "Script de vídeo gerado",
  "Creative generated": "Criativo gerado",
  "AI product discovery": "Descoberta de produto com inteligência",
  "AI Tool Validation": "Validação de ferramenta de inteligência",
  "Brand Video Script": "Script de vídeo da marca",
  "EcoBottle Product Discovery": "Descoberta de produto EcoBottle",
  "FitTrack App Content": "Conteúdo do app FitTrack",
  "Summer Sale Campaign": "Campanha de venda de verão",
};

export const MODULE_LABELS: Record<string, string> = {
  campaign: "Campanha",
  content: "Conteúdo",
  creative: "Criativo",
  video_script: "Script de Vídeo",
  product_discovery: "Descoberta de Produto",
  product_validation: "Validação de Produto",
  find_products: "Descoberta de Produto",
  validate_products: "Validação de Produto",
  "Find Products": "Buscar Produtos",
  "Validate Products": "Validar Produtos",
  "Creative": "Criativo",
  "Campaign": "Campanha",
  "Content": "Conteúdo",
  "Product Discovery": "Descoberta de Produto",
  "Product Validation": "Validação de Produto",
  "Video Script": "Script de Vídeo",
  marketing: "Marketing",
};

const DEMO_NAME_MAP: Record<string, string> = {
  "Summer Sale Campaign": "Campanha de Venda de Verão",
  "FitTrack App Content": "Conteúdo do App FitTrack",
  "EcoBottle Product Discovery": "Descoberta de Produto EcoBottle",
  "Brand Video Script": "Script de Vídeo da Marca",
  "AI Tool Validation": "Validação de Ferramenta de Inteligência",
};

function translateDemoName(text: string): string {
  for (const [en, pt] of Object.entries(DEMO_NAME_MAP)) {
    if (text.includes(en)) return text.replace(en, pt);
  }
  return text;
}

export function translateAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];

  if (/^Campaign created:/i.test(action))
    return translateDemoName(action.replace(/^Campaign created:/i, "Campanha criada:"));
  if (/^Campanha criada:/i.test(action))
    return translateDemoName(action);
  if (/^Campaign block refined:/i.test(action))
    return "Bloco de campanha refinado";
  if (/^Script created:/i.test(action))
    return translateDemoName(action.replace(/^Script created:/i, "Script criado:"));
  if (/^Script criado:/i.test(action))
    return translateDemoName(action);
  if (/^Content created:/i.test(action))
    return translateDemoName(action.replace(/^Content created:/i, "Conteúdo criado:"));
  if (/^Conteúdo criado:/i.test(action))
    return translateDemoName(action);
  if (/^Created campaign:/i.test(action))
    return translateDemoName(action.replace(/^Created campaign:/i, "Campanha criada:"));
  if (/^Descoberta de produto/i.test(action))
    return action;

  return translateDemoName(action);
}

export function translateModule(module: string): string {
  return MODULE_LABELS[module] ?? module.replace(/_/g, " ");
}
