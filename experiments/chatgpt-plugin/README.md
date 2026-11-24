# IAttom Assist — protótipo isolado para ChatGPT

Este diretório é independente da API, do banco, do Clerk, do Stripe e da implantação oficial. Não contém credenciais nem variáveis de produção.

## Rodar localmente

```bash
cd experiments/chatgpt-plugin
npm install
npm test
npm start
```

Prévia para navegador: `http://127.0.0.1:8787/`. Saúde: `/health`. Endpoint de conexão: `/mcp`. A única ferramenta, `conhecer_iattom`, mostra informações públicas. Não há operações pagas, acesso a usuários, autenticação simulada ou cobrança de créditos.

## Para completar a integração

1. Provisionar serviço **novo** e isolado em ambiente de teste, com URL HTTPS própria. Nunca apontar o serviço para o banco ou credenciais oficiais.
2. Configurar um provedor OAuth 2.1 de teste que ofereça descoberta, PKCE S256, client registration compatível com ChatGPT, audiência e escopos próprios para o MCP. Validar assinatura, emissor, audiência, validade e escopo em toda requisição protegida.
3. Integrar somente à cópia da API e a um banco de testes, conferir os planos internos (`free`, `pro`, `business`, `agency`), status do plano e saldos. Não confiar em plano ou ID informado pelo modelo.
4. Adicionar uma função paga por vez, reutilizando a regra de cobrança no servidor, com idempotência e reembolso seguro. Conferir concorrência na dedução dos créditos antes de habilitar chamadas reais.
5. Conectar a URL `/mcp` ao ChatGPT para teste privado; verificar FREE, cada plano pago, saldo zero, conta desconectada e falhas antes de qualquer publicação.

Nenhuma etapa deste protótipo altera o sistema em produção. A disponibilidade de criação/publicação de plugin depende da conta e da revisão da plataforma.
