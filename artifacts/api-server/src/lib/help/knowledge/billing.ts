import type { KnowledgeEntry } from "./index.js";

export const billing: KnowledgeEntry[] = [
  {
    id: "billing-plans",
    category: "billing",
    topic: "Planos disponíveis",
    keywords: ["plano", "planos", "preço", "valor", "assinatura", "mensalidade", "anual", "start", "premium", "pro", "free", "grátis", "quanto custa", "assinar"],
    status: "active",
    content: `O IAttom Assist oferece quatro planos:

FREE     — gratuito. Sem créditos de IA. Sem acesso ao IAttom Help.
START    — R$69/mês ou R$697/ano. 700 créditos/ciclo. 200 mensagens no IAttom Help.
PREMIUM  — R$159/mês ou R$1.565/ano. 1.500 créditos/ciclo. 350 mensagens no IAttom Help.
PRO      — R$299/mês ou R$2.870/ano. 3.250 créditos/ciclo. 700 mensagens no IAttom Help.

O plano anual oferece desconto equivalente a aproximadamente 2 meses grátis.
Todos os planos pagos dão acesso a todos os módulos de IA — a diferença está na quantidade de créditos por ciclo e no limite de mensagens do IAttom Help.`,
    relatedTopics: ["billing-upgrade", "credits-plans", "help-limits"],
  },
  {
    id: "billing-upgrade",
    category: "billing",
    topic: "Como fazer upgrade de plano",
    keywords: ["upgrade", "melhorar plano", "assinar", "contratar", "pagar", "checkout", "upgrade de plano", "como assinar", "subir de plano"],
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
  {
    id: "billing-packages",
    category: "billing",
    topic: "Pacotes avulsos — Criativos e Vídeos",
    keywords: ["pacote", "pacotes", "criativo", "criativos", "vídeo", "vídeos", "avulso", "comprar", "adicional", "pack", "criativo 20", "criativo 35", "criativo 50", "pack 5", "pack 7", "pack 10"],
    status: "active",
    content: `Além dos planos, o IAttom Assist oferece pacotes avulsos para necessidades específicas:

PACOTES DE CRIATIVO (créditos para geração de imagens):
— Criativo 20:  20 créditos criativos — compra avulsa
— Criativo 35:  35 créditos criativos — compra avulsa
— Criativo 50:  50 créditos criativos — compra avulsa

PACOTES DE VÍDEO (saldo próprio — não consome créditos internos):
— PACK 5:   5 vídeos
— PACK 7:   7 vídeos
— PACK 10: 10 vídeos

Os pacotes de vídeo funcionam com saldo próprio — independente dos créditos internos da plataforma.
Vídeos não consomem créditos internos. Cada geração desconta 1 unidade do saldo de vídeos.`,
    relatedTopics: ["billing-plans", "credits-feature-costs"],
  },
];
