# CRITICAL RULES - MUST FOLLOW

## RESPONSES

- Keep responses concise and to the point - unless the user asks otherwise

## PLANNING MODE

- Always ask clarifying questions
- Never assume design, tech stack or features
- Use deep-dive sub-agents to assist with research
- Use deep-dive sub-agents to review the different aspects of your plan before presenting to the user

## CHANGE / EDIT MODE

- Never implement features yourself when possible - use sub-agents!
- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently
- When using sub-agents to implement features, act as a coordinator only
- Use the best model for the task - premium models for complex tasks (like coding) and mid-tier models for simpler tasks, like documentation
- After completing features (large or small), always run commands like lint, type check and next build to check code quality

## DATABASE SCHEMA CHANGES

## DATABASE SCHEMA CHANGES

- NEVER execute database mutation commands automatically (e.g., `npm run db:push`, `drizzle-kit push`, `generate`, or `migrate`).
- The user will handle all database synchronizations manually to ensure data integrity.
- When you make changes to the database schema (e.g., modifying `schema.ts`), you MUST stop and instruct the user to run `npm run db:push` manually in their terminal.
- Provide the exact terminal commands (like `npm run db:push` followed by `npm run db:seed` if repopulation is needed) in a clear code block for the user to copy and paste.
- Wait for the user to confirm that the database push was successful before proceeding to write or modify any dependent Backend or Frontend code.

## TESTING

- Use any testing tools, libraries available to the project for testing your changes
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user whether testing should be skipped.

## UI DESIGN

- Always follow the UI design system when creating or reviewing components or pages.
- Design System: @DESIGN.md

# MiPSys Rebuild

Monorepo with two packages:

- `mipsys-backend/` — NestJS 11 + Drizzle ORM + MySQL (port 3001)
- `mipsys-frontend-v2/` — Next.js 16 + React 19 + Tailwind CSS 4 (port 3000)

## Commands

**Backend** (run from `mipsys-backend/`):
| Command | Purpose |
|---|---|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build (`nest build`) |
| `npm run test` | Jest unit tests (`*.spec.ts`) |
| `npm run test:e2e` | E2E tests (`test/*.e2e-spec.ts`) |
| `npm run lint` | ESLint with `--fix` |
| `npm run format` | Prettier on `src/` and `test/` |
| `npm run db:push` | Push Drizzle schema to MySQL |
| `npm run db:seed` | Seed test data |
| `npm run db:fresh` | Clean → push → seed |
| `npm run db:clean` | Drops all tables (uses `mysql` CLI at `D:\xampp\mysql\bin\mysql`) |

**Frontend** (run from `mipsys-frontend-v2/`):
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Architecture

### Backend structure

- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`.
- Custom `StandardHttpExceptionFilter` catches all exceptions → standardized JSON.
- DB: `DatabaseModule` is `@Global()`, provides `'DB_CONNECTION'` (Drizzle `mysql2` pool).
- **CRITICAL - State Machines:** `sr-state-machine.guard.ts` (service request status transitions) and `po-state-machine.guard.ts` (purchase order). ALL status mutations MUST be validated against these procedural matrices to prevent illegal bypasses.
- **CRITICAL - Atomic Transactions:** Inventory changes (e.g., saving diagnosis and part picking) MUST use `db.transaction()` with row locking (`.for('update')`) to prevent phantom stock and race conditions.
- Service request modules follow DDD: `controller → service → drizzle queries`.
- Drizzle schema in `src/database/schema/`, relations in `relations.ts`.
- DB name: `db_mipsys`, configured via `.env`.
- Each module is flat: `module.ts`, `service.ts`, `controller.ts`, `dto/`.

### Frontend structure

```
src/
  app/           # Next.js App Router pages (layout.tsx, page.tsx, feature routes)
  features/      # Domain logic per feature (api/, components/, hooks/, services/, schemas/, types/)
  components/    # Shared UI (layout/, ui/)
  lib/           # api-client.ts, utils.ts
```

- Path alias `@/*` maps to repo root (e.g. `@/src/components/...`)
- API base URL hardcoded to `http://localhost:3001`
- `adminId` hardcoded to `1` in feature API calls
- `react-hot-toast` for notifications, configured in root layout

### Testing

- Jest config inline in backend `package.json` (not a separate file)
- Test files co-located: `*.spec.ts` next to source, `*.e2e-spec.ts` in `test/`
- Frontend has no test script or test files yet

## Conventions & Gotchas

- Backend `.env` is committed (non-standard). Run `db:fresh` after schema changes.
- Frontend uses `'use client'` extensively (appears to be mostly client components)
- `db:clean` script has a hardcoded Windows path to XAMPP MySQL — will fail on other environments
- Frontend README.md has unresolved git merge conflict markers (`<<<<<<< HEAD` / `=======` / `>>>>>>> 1fcc74e`)
- `mipsys-frontend-v2/AGENTS.md` warns Next.js 16 may have breaking changes — check `node_modules/next/dist/docs/` before writing code
- Backend uses CommonJS-incompatible `nodenext` module resolution in tsconfig
- Drizzle config is minimal: `schema: './src/database/schema/index.ts'`, `dialect: 'mysql'`
- No migrations folder — schema is pushed directly via `drizzle-kit push`
- Seed file (`src/database/seeds/seed.ts`) creates staff, customers, products, service requests, etc.
- The inventory module handles spare parts (`spareParts` table) with stock tracking via `stockMovements`
- `orderParts` service is imported by `ServiceRequestService` and `FinanceService`
