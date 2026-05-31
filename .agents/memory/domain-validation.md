---
name: Domínio oficial validado — iattomassist.com.br
description: Estado validado do domínio oficial, correção de redirects Clerk e regras de proteção da base estável.
---

## Estado validado (checkpoint cc8d634 / 428a8ea)

### Domínios
- **Oficial**: `https://iattomassist.com.br`
- **Fallback técnico**: `https://i-attom-backup-26-05.replit.app`

### Validações confirmadas
- SSL ativo em ambos os domínios
- DNS: A → 34.111.179.208, TXT → replit-verify=9bfc23a7...
- CNAMEs Clerk para email: clkmail, clk._domainkey, clk2._domainkey
- Replit Domains: status VERIFIED
- Clerk proxy `/api/__clerk` funcionando (HTTP 200)
- Login Google funcionando com redirect correto
- Dashboard, Admin, Créditos, Projetos Salvos funcionando
- PWA instalado via domínio oficial

### Correção de redirect Clerk aplicada
**Arquivo:** `artifacts/iattom-assist/src/App.tsx` — ClerkProvider

Props adicionadas:
```tsx
signInFallbackRedirectUrl={`${window.location.origin}${basePath}/dashboard`}
signUpFallbackRedirectUrl={`${window.location.origin}${basePath}/dashboard`}
```

**Por que:** A instância Clerk de produção (gerenciada internamente pelo Replit, não acessível via dashboard.clerk.com) ainda tinha `after_sign_in_url` e `after_sign_up_url` apontando para o domínio antigo. Como esses campos não são editáveis via Auth pane, a solução foi sobrescrever via props do ClerkProvider. Usar `window.location.origin` garante compatibilidade automática com qualquer domínio (oficial, fallback, preview).

**Nota SDK:** Clerk v6 (`^6.5.0`) removeu `afterSignInUrl`/`afterSignUpUrl` do `ClerkProviderProps`. Os props corretos são `signInFallbackRedirectUrl` e `signUpFallbackRedirectUrl`.

### Arquitetura Clerk confirmada
- Instância dev (`sharp-parrot-42.clerk.accounts.dev`): visível em dashboard.clerk.com do usuário, usa `pk_test`
- Instância produção (`IAttom-Backup-26-05`): gerenciada internamente pelo Replit, NÃO visível em dashboard.clerk.com, usa `pk_live` (injetado automaticamente no publish)
- Os campos `sign_in_url`/`sign_up_url` foram atualizados automaticamente pelo Replit ao conectar o domínio customizado
- Os campos `home_url`/`after_sign_in_url`/`after_sign_up_url` NÃO foram atualizados automaticamente — por isso a correção via código

### Áreas blindadas — não tocar sem autorização explícita
- Domínio, DNS, Registro.br
- Clerk (dashboard, Auth pane, instância)
- `App.tsx` — bloco ClerkProvider (signInFallbackRedirectUrl, signUpFallbackRedirectUrl)
- `App.tsx` — bloco showContent/onExitComplete (splash)
- Replit Domains, Deployments
- Banco de dados, Integrações
- Todos os módulos USER e ADMIN listados em replit.md

**Why:** Base estável validada e aprovada em produção. Qualquer alteração fora do escopo exato solicitado pode quebrar autenticação, redirects ou PWA no domínio oficial.
