---
name: test-app
description: Install, lint, build, run, debug, and end-to-end test the local-services Next.js app before every PR, including recording a video of the test session and completing the PR checklist.
---

# test-app

Use this skill before opening **every** PR. It verifies that the change lints, builds, runs, and behaves correctly end-to-end, and that a video of the manual test session is attached to the PR.

## 1. Install

```bash
npm install
```

Run from the repo root. Re-run whenever `package.json` or `package-lock.json` changes.

## 2. Configure environment

Secrets and connection settings come from environment variables in `.env.local` (git-ignored; never commit any `.env*` file). Typical variables:

- `NEXTAUTH_URL` — e.g. `http://localhost:3000`
- `NEXTAUTH_SECRET` — any random string locally (e.g. `openssl rand -base64 32`)
- `REDIS_URL` — e.g. `redis://localhost:6379` (only if the change touches Redis-backed code; start Redis with `redis-server` or `docker run -p 6379:6379 redis`)

The SQLite database lives at `data/services.db` and is created/initialized by `src/lib/db.ts` on first use.

## 3. Lint

```bash
npm run lint
```

Must pass with **zero errors** before opening a PR. Fix every reported error; do not disable rules to silence them.

## 4. Build check

```bash
npm run build
```

Catches TypeScript (strict mode) and compile errors that `next dev` may not surface. Must succeed before opening a PR.

## 5. Run

```bash
npm run dev
```

The app serves at http://localhost:3000 by default (the terminal prints the actual URL if the port is taken). Verify the key flows:

- **Pages load**: `/` (service catalog), `/providers`, `/provider/<id>`, `/auth/signin`, `/auth/signup`, `/customer/dashboard`, `/provider/dashboard` render without errors in the page or the browser console.
- **Auth flows**: sign up a new user at `/auth/signup` (`POST /api/auth/register`), sign in at `/auth/signin`, confirm the session is reflected in the navigation, sign out, and confirm protected dashboards redirect or deny access when signed out.
- **Socket.io connections**: on pages using real-time features, open the browser DevTools Network tab (filter `WS`) and confirm the socket.io connection is established without repeated reconnect errors; trigger an event (e.g. create/update a booking) and confirm the other side receives it.
- **SQLite-backed operations**: create, read, and update records through the UI or API routes (`/api/services`, `/api/providers`, `/api/bookings`, `/api/bookings/<id>/status`, `/api/notifications`, `/api/notifications/<id>/read`, `/api/notifications/mark-all-read`) and confirm the changes persist after a page reload. For API checks you can use `curl`, e.g. `curl -s http://localhost:3000/api/services`.

## 6. Debugging

Check, in order:

1. **`next dev` terminal output** — server-side errors, route handler stack traces, compile errors.
2. **Browser console** — client component errors, hydration mismatches, failed fetches.
3. **Browser Network tab** — failing API responses (status codes and response bodies) and WebSocket frames.
4. **Server logs** — any logging from route handlers and `src/lib/` utilities.

Common issues:

- **Missing env vars** — NextAuth errors such as `NO_SECRET` or wrong callback URLs: set `NEXTAUTH_SECRET` / `NEXTAUTH_URL` in `.env.local` and restart `npm run dev`.
- **Redis connection failures** — `ECONNREFUSED 127.0.0.1:6379` or repeated `ioredis` reconnect logs: start Redis or fix `REDIS_URL`.
- **SQLite failures** — `SQLITE_CANTOPEN` (the `data/` directory is missing or not writable), `SQLITE_BUSY` (another process holds the DB lock; stop other dev servers), or native module errors from `better-sqlite3` after a Node version change (run `npm rebuild better-sqlite3`).
- **Server-only module in a client component** — build errors about `fs`, `path`, or `better-sqlite3` in the browser bundle: move the import into a Server Component or route handler.
- **Stale build output** — delete `.next/` and restart.

## 7. Testing

Before every PR:

1. Run the automated tests covering your change (tests are required for all changes, see `AGENTS.md`).
2. Start the app with `npm run dev` and exercise the **changed functionality end-to-end** in the browser, plus a quick smoke test of the flows in step 5 that the change could affect.
3. **Record a video** of the test session: a screen recording showing the app running and each manual test step being performed (and its result). Attach the recording to the PR description.

## PR checklist

Copy into the PR description and tick every item:

- [ ] `npm run lint` is clean (zero errors)
- [ ] `npm run build` passes
- [ ] App runs with `npm run dev` without errors
- [ ] Changed flows manually verified end-to-end
- [ ] Tests added/updated for the change
- [ ] Video recording of the test session attached
- [ ] No secrets, credentials, API keys, or `.env*` files in the diff
