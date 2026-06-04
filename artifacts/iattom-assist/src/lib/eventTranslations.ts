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
  "AI product discovery": "Descoberta de produto com IA",
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
  marketing: "Marketing",
};

export function translateAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];

  if (/^Campaign created:/i.test(action))
    return action.replace(/^Campaign created:/i, "Campanha criada:");
  if (/^Campaign block refined:/i.test(action))
    return "Bloco de campanha refinado";
  if (/^Script created:/i.test(action))
    return action.replace(/^Script created:/i, "Script criado:");
  if (/^Content created:/i.test(action))
    return action.replace(/^Content created:/i, "Conteúdo criado:");
  if (/^Created campaign:/i.test(action))
    return action.replace(/^Created campaign:/i, "Campanha criada:");

  return action;
}

export function translateModule(module: string): string {
  return MODULE_LABELS[module] ?? module.replace(/_/g, " ");
}
