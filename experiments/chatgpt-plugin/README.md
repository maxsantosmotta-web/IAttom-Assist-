# IAttom Assist — conexão isolada para ChatGPT

Este diretório é independente da API, do banco, do Clerk, do Stripe e da implantação oficial. Não contém credenciais nem variáveis de produção. A instância OAuth é a aplicação Clerk de desenvolvimento **IAttom ChatGPT Sandbox**, separada do login oficial.

## Rodar localmente

```bash
cd experiments/chatgpt-plugin
npm install
npm test
MCP_RESOURCE_URL=http://127.0.0.1:8787/mcp CLERK_OAUTH_ISSUER=https://ample-chimp-6231.clerk.accounts.dev npm start
```

Prévia para navegador: `http://127.0.0.1:8787/`. Saúde: `/health`. Endpoint de conexão: `/mcp`. O serviço hospedado está em `https://iattom-mcp-preview-test.up.railway.app/mcp`. A única ferramenta, `conhecer_iattom`, mostra informações públicas. O ChatGPT pode descobrir sua descrição sem login; a chamada da ferramenta exige token OAuth emitido pela instância de teste, com assinatura, emissor, audiência e escopo `profile` verificados. A chamada autenticada foi testada pelo plugin privado em 24/11/2026.

**Estado do produto:** a autenticação técnica funciona. Ainda não há operações pagas, acesso ao cadastro oficial, plano, saldo ou cobrança de créditos. A conta de teste do Clerk não corresponde automaticamente ao usuário no Clerk oficial; não se deve assumir plano nem saldo a partir do endereço de e-mail.

## Para completar a integração

1. Provisionar somente dados de teste e credenciais próprias para uma cópia da API. O serviço MCP atual não tem banco, chave de IA nem autorização para usar o banco oficial.
2. Criar uma correspondência explícita entre o usuário da instância Clerk de teste e o cadastro de teste. Nunca confiar em e-mail, plano ou saldo fornecidos pelo modelo.
3. Reutilizar a lógica da API em uma cópia isolada. O código atual representa START por `pro`, PREMIUM por `business` e PRO por `agency`; conferir as regras de acesso com os módulos reais antes de expô-los.
4. Adicionar uma função paga por vez, reutilizando a cobrança no servidor, com idempotência e reembolso seguro. Conferir concorrência na dedução dos créditos antes de habilitar chamadas reais.
5. Atualizar a lista de ferramentas no plugin privado e testar FREE, cada plano pago, saldo zero, conta desconectada e falhas antes de qualquer publicação.

Nenhuma etapa deste protótipo altera o sistema em produção. A disponibilidade de criação/publicação de plugin depende da conta e da revisão da plataforma.
