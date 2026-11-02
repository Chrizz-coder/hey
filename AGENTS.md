<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Guide: local-services

Full-stack Next.js 16 (App Router) app connecting customers with local service providers: service catalog, provider profiles, bookings, notifications, and authentication.

## Project Structure

- `src/app/` — App Router pages, layouts, and route handlers (`src/app/api/**/route.ts`).
- `src/components/` — Shared React components (e.g. `Navigation.tsx`, `Providers.tsx`).
- `src/lib/` — Server utilities: SQLite via `better-sqlite3` (`db.ts`, database file at `data/services.db`), Redis via `ioredis`, authentication via `next-auth` (`auth.ts`), and real-time messaging via `socket.io` / `socket.io-client`.
- `src/types/` — Shared TypeScript types and module augmentations (e.g. `next-auth.d.ts`).
- `public/` — Static assets served from the site root.

## Conventions

- **TypeScript strict mode** (`"strict": true` in `tsconfig.json`). No implicit `any`; type all props, route handler params, and API responses. Put shared types in `src/types/`.
- **App Router patterns**: pages are `page.tsx`, layouts are `layout.tsx`, API endpoints are `route.ts` exporting HTTP method handlers (`GET`, `POST`, ...). Dynamic segments use `[param]` folders. Check `node_modules/next/dist/docs/` for the current APIs before writing code (see the block above).
- **Server vs client components**: components are Server Components by default. Add `"use client"` only when a component needs state, effects, event handlers, browser APIs, or client-only hooks (e.g. `useSession`, socket.io client). Never import server-only modules (`better-sqlite3`, `ioredis`, `src/lib/db.ts`, secrets) into client components; access data through Server Components or route handlers instead.
- Styling uses Tailwind CSS v4.

## Rules

- **Tests are required for all changes.** Every change must include tests covering the new or changed behavior.
- **No secrets in code.** Never commit secrets, credentials, or API keys. Read them from environment variables (use `.env.local` locally). Never commit any `.env*` file (they are git-ignored).
- **Lint before PR.** Run `npm run lint` and fix all errors before opening a PR.
- **Verify the app before every PR.** Run the app and verify behavior using the `test-app` skill (`.agents/skills/test-app/SKILL.md`) before opening every PR.
