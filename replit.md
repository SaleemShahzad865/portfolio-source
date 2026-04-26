# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Portfolio (artifacts/portfolio)

Personal portfolio for Saleem Shahzad — Electrical Engineer (Embedded Systems, PCB Design, Arduino, ESP32). Dark "engineer's workbench" theme with electric green/cyan accents, glass-morphism, framer-motion. Fonts: Syne (display), Inter (body), Orbitron (mono).

### Public pages
`/`, `/about`, `/projects`, `/skills`, `/contact`, `/blog`, `/blog/:slug` — all data is fetched live from the API (no static `src/data/posts.ts` anymore). Editable text comes from `useListSections()` via `src/hooks/useSection.ts`.

### Admin panel
`/admin/*` — protected by Replit Auth via `@workspace/replit-auth-web`'s `useAuth()`. Routes:
- `/admin/login` — single Sign in button (full-page redirect to `/api/login`)
- `/admin` — dashboard with counts and recents
- `/admin/posts`, `/admin/posts/new`, `/admin/posts/:id` — blog post CRUD with side-by-side markdown preview
- `/admin/projects`, `/admin/projects/new`, `/admin/projects/:id` — projects CRUD
- `/admin/sections` — editable site copy keyed by section name

Admin is reached by typing the URL — there is no public link to it. Never use the words "Replit" or "Replit Auth" in the UI.

## Backend (artifacts/api-server)

Express 5 + Drizzle. Auth: Replit OIDC (cookie sessions in PostgreSQL). Routes mounted at `/api`:
- `auth/*` — login, callback, logout, mobile token exchange
- `posts/*` — public GET (only published unless authed); auth-required POST/PATCH/DELETE
- `projects/*` — public GET; auth-required POST/PATCH/DELETE
- `sections`, `sections/{key}` — public GET; auth-required PUT (upsert)

DB tables (`lib/db/src/schema/`): `auth.ts` (sessions, users), `posts.ts`, `projects.ts`, `sections.ts` (key-value site copy).

Seed script: `cd artifacts/api-server && pnpm exec tsx scripts/seed.ts` (idempotent — skips tables that already have data).

### Section keys
`home_name`, `home_role`, `home_tagline`, `about_intro`, `about_philosophy`, `contact_email`, `contact_location`, `contact_github`, `contact_linkedin`. The admin Sections page renders all of these with friendly labels.
