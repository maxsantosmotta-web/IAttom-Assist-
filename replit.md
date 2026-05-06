# IAttom Assist

A premium dark-themed AI business assistant SaaS platform for product discovery, validation, campaign creation, content generation, creative generation, video scripts, and marketing automation. Full Clerk authentication with private user workspaces.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/iattom-assist run dev` — run the frontend (port 25638)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Framer Motion, shadcn/ui, wouter, @clerk/react
- API: Express 5, @clerk/express
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (Replit-managed) — email/password + Google OAuth
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/iattom-assist/src/App.tsx` — ClerkProvider, routing, sign-in/sign-up pages
- `artifacts/iattom-assist/src/pages/` — all pages (LandingPage, dashboard/)
- `artifacts/iattom-assist/src/components/layout/SidebarLayout.tsx` — dashboard shell with useUser/signOut
- `artifacts/iattom-assist/src/index.css` — dark theme, gold accent CSS variables, Clerk layer ordering
- `artifacts/iattom-assist/public/logo.svg` — branded SVG logo used in Clerk sign-in/sign-up
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/users.ts` — users table (clerkId, role, plan, credits)
- `lib/db/src/schema/projects.ts` — projects table (clerkUserId scoping)
- `lib/db/src/schema/history.ts` — history/activity table (clerkUserId scoping)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Clerk auth guard middleware
- `artifacts/api-server/src/routes/` — Express route handlers (all protected)

## Architecture decisions

- App is always dark mode; "dark" class applied globally to `<html>` — no theme toggle needed
- `lib/api-zod/src/index.ts` only exports from `./generated/api` (not `./generated/types`) to avoid naming conflicts from Orval split mode
- Auth: Clerk (Replit-managed). Routes: `/sign-in/*?` and `/sign-up/*?` with `routing="path"` + full `path` props
- Dashboard routes protected with `<Show when="signed-in">` + `requireAuth` middleware on all API routes
- All projects and history records are scoped by `clerkUserId` — full private workspace per user
- Users table has `role` (user/admin), `plan` (free/pro/business), `credits` fields — ready for future RBAC, subscriptions, credits system
- History records written to DB on project create/update with `clerkUserId`

## Product

- Landing page with hero, features, CTA — links to /sign-in and /sign-up
- Clerk sign-in/sign-up pages with dark gold branded appearance (logo, colors, typography)
- Dashboard with sidebar navigation (10 sections)
- Sidebar shows real user name/avatar from Clerk, with sign-out dropdown
- Dashboard Home: real stats scoped to authenticated user
- Projects: full CRUD with create dialog and delete — private per user
- History: real activity feed scoped per user
- All AI feature pages use mock/placeholder output

## User preferences

- Dark premium design with gold accents (#C9A84C range)
- No emojis in UI
- No real AI APIs in v1 — mock data and placeholder functionality only

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always re-run codegen AND fix `lib/api-zod/src/index.ts`
- Never use `console.log` in server code — use `req.log` in handlers or `logger` singleton
- Wildcard routes in Express 5 must use `/{*splat}` syntax (not bare `*`)
- Clerk `<SignIn path>` and `<SignUp path>` must use **full** window paths including base path
- Routes must use `/*?` optional wildcard for Clerk multi-step OAuth sub-paths to work
- Tailwind v4: `tailwindcss({ optimize: false })` in vite.config.ts — prevents Clerk themes CSS reordering in prod
- `@layer theme, base, clerk, components, utilities;` must come before `@import "tailwindcss"` in index.css
- After changing schema files, run `pnpm run typecheck:libs` to rebuild composite lib declarations before API server typecheck

## Pointers

- See the `clerk-auth` skill for auth setup and customization details
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `react-vite` skill for frontend conventions
