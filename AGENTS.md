# Mipsys Rebuild

Monorepo with two packages: `mipsys-backend/` (NestJS 11) and `mipsys-frontend-v2/` (Next.js 16 App Router).

## Quick start

```bash
# backend (port 3001)
cd mipsys-backend && cp .env.example .env  # edit DB creds
npm install && npm run dev

# frontend (port 3000, API -> localhost:3001)
cd mipsys-frontend-v2 && npm install && npm run dev
```

## Architecture

- **Backend**: NestJS 11 + Drizzle ORM (MySQL) + class-validator. Modules in `src/{module}/` with controller, service, module, dto/ files. Global `ValidationPipe` with `whitelist: true`. Global `StandardHttpExceptionFilter`.
- **Frontend**: Next.js 16 App Router + React 19 + Tailwind CSS v4 + shadcn/ui (radix-lyra style). Pages under `src/app/{route}/`, feature logic under `src/features/{module}/`, shared UI in `src/components/ui/`. Axios client at `src/lib/api-client.ts`.
- **State machine** (`sr-state-machine.guard.ts`): Service requests follow `WAITING_CHECK → CHECK → WAITING_APPROVE → SERVICE/DONE` or `→ AWAITING_PARTS → SERVICE/DONE` or `→ CANCEL` from any non-terminal state.

## Key commands

| Package  | Command            | Purpose                                 |
| -------- | ------------------ | --------------------------------------- |
| backend  | `npm run dev`      | Watch mode (nest start --watch)         |
| backend  | `npm run build`    | nest build                              |
| backend  | `npm run lint`     | ESLint with prettier plugin, `--fix`    |
| backend  | `npm run test`     | Jest (`.spec.ts` files)                 |
| backend  | `npm run test:e2e` | Jest via `test/jest-e2e.json`           |
| backend  | `npm run db:fresh` | Clean DB → push → seed (schema changes) |
| frontend | `npm run dev`      | Next dev server                         |
| frontend | `npm run build`    | Next build (type-check + bundle)        |
| frontend | `npm run lint`     | ESLint with `eslint-config-next`        |

## Database schema changes

- **Always** use `npm run db:fresh` (clean → drizzle push → seed)
- **Never** run `drizzle-kit push` directly (use `db:push` script only as part of `db:fresh`)
- Schema files in `mipsys-backend/src/database/schema/`
- `drizzle.config.ts` at backend root, MySQL dialect, `DATABASE_URL` env

## Design system

Dark-first "war room" theme. Full spec in `DESIGN.md`. Key rules:

- Fonts: IBM Plex Sans (body), Fraunces (display), IBM Plex Mono (code)
- Colors: oklch throughout. Amber primary, teal accent, violet depth
- Utility classes in `globals.css`: `.planner-bg`, `.glass-panel`, `.paper-card`, `.blueprint-surface`, `.command-strip`, `.micro-label`
- Theme tokens bridged via `@theme inline` to Tailwind. Dark mode is class-based, dark default.
- shadcn components use radix-lyra style, Phosphor icon library

## Conventions

- **Backend**: `noImplicitAny: false` (intentional). Prettier: semi, singleQuote, trailingComma es5, 80 printWidth
- **Frontend**: `strict: true`. Path alias `@/*` → root. Prettier: singleQuote, trailingComma all
- **Commits**: conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
- **Testing**: Jest in backend only (no frontend test framework configured)
