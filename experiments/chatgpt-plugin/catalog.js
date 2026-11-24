// Public product description only. These labels mirror the existing API gates.
// Never treat this catalog as authorization for a paid operation.
export const modules = Object.freeze([
  { name: "Buscar produtos", plans: ["PRO"], credits: 5 },
  { name: "Validar produto", plans: ["PREMIUM", "PRO"], credits: 5 },
  { name: "Criar campanha", plans: ["START", "PREMIUM", "PRO"], credits: 10 },
  { name: "Criar conteúdo", plans: ["PRO"], credits: 8 },
  { name: "Criar roteiro", plans: ["PREMIUM", "PRO"], credits: 10 },
]);

export const publicCatalog = Object.freeze({
  product: "IAttom Assist",
  description: "Plataforma de marketing digital para pesquisa de produtos e criação de campanhas e conteúdo.",
  website: "https://iattomassist.com.br",
  freeAccess: "Visualização do catálogo; execução dos módulos bloqueada.",
  modules,
  note: "A disponibilidade e o saldo real são confirmados somente após conectar uma conta IAttom. Este protótipo não executa módulos e não consulta contas.",
});
