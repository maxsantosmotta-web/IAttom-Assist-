---
name: Clerk key trailing dots bug
description: Replit injects VITE_CLERK_PUBLISHABLE_KEY with literal "..." appended — causes browser atob() to throw, Clerk sets frontendApi="" and loads https:///npm/... URL.
---

## Rule
Strip trailing dots from `VITE_CLERK_PUBLISHABLE_KEY` in the frontend before passing to ClerkProvider.

```ts
const clerkPubKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string)?.replace(/\.+$/, "");
```

**Why:** Replit's auto-injected Clerk publishable key has literal `...` appended (confirmed via `printenv | wc -c` = 58 chars vs 55 correct). Node.js `Buffer.from(b64, 'base64')` tolerates invalid chars and decodes correctly; browser `atob()` is strict and throws `DOMException`. Clerk SDK catches the throw, returns null, sets `frontendApi = ""`, constructs `https:///npm/@clerk/clerk-js@6/dist/clerk.browser.js` — "Failed to load Clerk JS".

**How to apply:** Always include this `.replace(/\.+$/, "")` sanitizer when reading `VITE_CLERK_PUBLISHABLE_KEY` in App.tsx. Do NOT try to overwrite the secret via `setEnvVars` — it's registered as a secret and throws "already set up as secret" conflict.
