# IAttom Assist

A premium dark-themed AI business assistant SaaS platform for product discovery, validation, campaign creation, content generation, creative generation, video scripts, and marketing automation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/iattom-assist run dev` — run the frontend (port 25638)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, shadcn/ui, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/iattom-assist/src/pages/` — all pages (Landing, Login, Register, dashboard/)
- `artifacts/iattom-assist/src/components/layout/SidebarLayout.tsx` — main dashboard shell
- `artifacts/iattom-assist/src/index.css` — dark theme, gold accent CSS variables
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/projects.ts` — projects table
- `lib/db/src/schema/history.ts` — history/activity table
- `artifacts/api-server/src/routes/` — Express route handlers

## Architecture decisions

- App is always dark mode; "dark" class applied globally to `<html>` — no theme toggle needed
- `lib/api-zod/src/index.ts` only exports from `./generated/api` (not `./generated/types`) to avoid naming conflicts from Orval split mode
- No real auth yet — login/register navigate directly to dashboard (mock flow)
- All dashboard AI features use mock data/placeholder UI — no real AI APIs in v1
- History records are written to DB on project create/update to track activity

## Product

- Landing page with hero, features, CTA
- Login and Register pages
- Dashboard with sidebar navigation (10 sections: Home, Find Products, Validate Products, Create Campaign, Create Content, Creative Generator, Video Scripts, Projects, History, Settings)
- Dashboard Home shows real stats (useGetDashboardSummary) and recent projects (useListProjects)
- Projects page: full CRUD with create dialog and delete — wired to real API
- History page: real activity feed from backend
- All AI feature pages (FindProducts, ValidateProducts, CreateCampaign, CreateContent, CreativeGenerator, VideoScripts) use mock/placeholder output

## User preferences

- Dark premium design with gold accents (#C9A84C range)
- No emojis in UI
- No real AI APIs in v1 — mock data and placeholder functionality only

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always re-run codegen AND fix `lib/api-zod/src/index.ts` to remove the `./generated/types` and `./generated/api.schemas` exports (Orval regenerates them with stale paths)
- Never use `console.log` in server code — use `req.log` in handlers or `logger` singleton
- Wildcard routes in Express 5 must use `/{*splat}` syntax (not bare `*`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `react-vite` skill for frontend conventions and design subagent delegation
