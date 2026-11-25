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

**Estado do produto:** a autenticação técnica da prévia funciona, mas usa uma instância Clerk de desenvolvimento. Essa instância não representa a conta de um assinante do IAttom. Ainda não há operações pagas, acesso ao cadastro oficial, plano, saldo ou cobrança de créditos.

## Regra da integração definitiva

O ChatGPT é outro cliente da **mesma conta IAttom**. A autorização OAuth deve ser emitida pela instância Clerk que já identifica os usuários da plataforma. O servidor valida o token e usa o ID autenticado para buscar o plano, a assinatura e os créditos existentes daquele usuário. O Stripe continua sendo o mesmo sistema de assinaturas; não se cria uma assinatura, um cliente Stripe ou uma carteira de créditos paralela para o ChatGPT. E-mail informado pelo modelo não identifica usuário nem concede acesso.

O serviço de teste pode manter código e infraestrutura separados, mas a validação do FREE e da conta paga precisa provar que ambos chegam ao cadastro correto. A geração de imagem com efeito permanece fora do escopo inicial. Nenhuma rota paga pode ser exposta enquanto o débito de créditos depender apenas da interface web: a execução e a cobrança precisam ser coordenadas no servidor, com prevenção de duplicidade e reembolso idempotente em caso de falha.

## Para completar a integração

1. Preparar em branch e serviço de teste o MCP para OAuth da instância Clerk oficial; validar tokens OAuth, inclusive formatos opacos, audiência, escopos e ID do usuário. A prévia atual continua isolada até a troca estar pronta.
2. Reutilizar o cadastro, os planos, as assinaturas Stripe e os saldos do próprio IAttom para a identidade autenticada, sem duplicar contas. O código representa START por `pro`, PREMIUM por `business` e PRO por `agency`.
3. Construir as ferramentas correspondentes aos módulos reais, com autorização e débito garantidos no servidor. Não anunciar módulos inexistentes nem geração de imagem com efeito.
4. Concluir o caminho inteiro antes da rodada de testes: FREE primeiro, depois a conta paga do proprietário, saldo zero, conta desconectada, concorrência e falhas. Manter o código oficial intacto durante o desenvolvimento.

Nenhuma etapa deste protótipo altera o sistema em produção. A disponibilidade de criação/publicação de plugin depende da conta e da revisão da plataforma.
