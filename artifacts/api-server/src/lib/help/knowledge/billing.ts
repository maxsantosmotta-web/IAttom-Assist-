import type { KnowledgeEntry } from "./index.js";

export const billing: KnowledgeEntry[] = [
  {
    id: "billing-plans",
    category: "billing",
    topic: "Planos disponíveis",
    keywords: ["plano", "planos", "preço", "valor", "assinatura", "mensalidade", "anual", "start", "completo", "premium", "pro", "free"],
    status: "active",
    content: `O IAttom Assist oferece quatro planos:

START    (Free):        50 créditos — R$19,90/mês
COMPLETO (Pro):        500 créditos — R$89/mês ou R$968/ano
PREMIUM  (Business): 2.000 créditos — R$197/mês ou R$1.997/ano
PRO      (Agency):  10.000 créditos — R$497/mês ou R$4.997/ano

O plano anual oferece desconto equivalente a aproximadamente 2 meses grátis.
Todos os planos dão acesso a todos os módulos de IA — a diferença está na quantidade de créditos disponíveis por ciclo.`,
    relatedTopics: ["billing-upgrade", "credits-plans"],
  },
  {
    id: "billing-upgrade",
    category: "billing",
    topic: "Como fazer upgrade de plano",
    keywords: ["upgrade", "melhorar plano", "assinar", "contratar", "pagar", "checkout", "upgrade de plano", "como assinar"],
    status: "active",
    content: `O upgrade de plano é processado com segurança via Stripe.

Passo a passo:
1. Acesse Faturamento (/dashboard/billing).
2. Clique em "Fazer Upgrade" ou no plano desejado.
3. Um checkout seguro do Stripe será aberto.
4. Após o pagamento confirmado, o saldo de créditos é atualizado imediatamente para o limite do novo plano.

Não é necessário inserir dados de cartão manualmente no IAttom — o Stripe gerencia o processo com segurança.`,
    relatedTopics: ["billing-plans", "billing-portal"],
  },
  {
    id: "billing-portal",
    category: "billing",
    topic: "Portal de assinatura e cancelamento",
    keywords: ["cancelar", "cancelamento", "portal", "gerenciar assinatura", "trocar plano", "downgrade", "mudar plano"],
    status: "active",
    content: `O usuário pode gerenciar a assinatura, trocar de plano ou cancelar pelo portal Stripe.

Acesso: Faturamento > Gerenciar Assinatura.

Ao cancelar, o acesso ao plano atual permanece ativo até o fim do período pago — não há corte imediato.
O downgrade para um plano menor é processado no próximo ciclo de cobrança.`,
    relatedTopics: ["billing-plans", "billing-upgrade"],
  },
];
