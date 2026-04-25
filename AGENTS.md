# Repository Guidelines

## Project Structure & Module Organization

This is a Vue 3 + Quasar + TypeScript app with a Hono backend and Supabase database.

- `src/` contains the frontend: `components/`, `pages/` for file-based routes, `composables/`, `services/`, `stores/`, `types/`, and shared styles/assets.
- `server/` contains the Hono API: `routes/`, `middleware/`, `validation/`, `db/`, `types/`, and `utils/`.
- `supabase/` contains migrations, seed data, and schema artifacts.
- `tests/e2e/` contains Playwright end-to-end tests.
- `public/` stores static assets served by Vite.
- `docs/` captures architecture, standards, and domain notes.

## Thread Cone Business Context

The product tracks sewing thread at cone level for garment manufacturing. A cone (`thread_inventory`) is the physical barcode-scanned unit stored in a warehouse. Each cone belongs to a thread type, supplier/color identity, lot, and warehouse, and carries both remaining meters and weight.

Core lifecycle:

- Purchase/order planning creates expected demand.
- Receiving creates cones and lots in inventory.
- FEFO allocation reserves the oldest eligible lots first.
- Issue V2 confirms cones for production and records return logs.
- Recovery weighs leftover cones, confirms usable returns, or writes them off.
- Reconciliation compares physical warehouse stock against system stock.

Important invariants:

- `thread_type` identity is the exact business combination of supplier (NCC), tex number, and thread color. If any one of NCC, Tex, or Màu differs, it is a different stock item.
- Never merge stock across that identity boundary. Example only: `Coats Epic - Tex 40 - C9700` and `Coats Epic - Tex 40 - C9701` differ by color, so they are separate thread types and must be counted, ordered, reserved, issued, and reported separately.
- Inventory uses dual UoM: meters for production demand and grams/kg for weighing partial cones. Do not update one without understanding the other.
- Cone statuses are database enums and must match `src/types/thread/enums.ts`; use migrations for changes.
- Allocation/reserve/issue/recovery should go through existing backend routes and RPCs such as FEFO allocation, `fn_issue_cone`, `fn_recover_cone`, `fn_reserve_from_stock`, and return-with-movements flows.
- Every stock-changing action should leave an audit trail in movement/history tables or the relevant return/recovery log.

Weekly order business matters because it can borrow, reserve, transfer, and auto-return cones. Closing a weekly cycle can settle loans automatically, and reserve-from-stock reduces available inventory immediately. Always check `docs/project-overview-pdr.md` and `docs/system-architecture.md` before changing weekly order, allocation, issue, or recovery behavior.

## Build, Test, and Development Commands

- `npm run dev` starts the Vite frontend on port `5173`.
- `npm run server` starts the Hono backend from `server/index.ts`.
- `npm run dev:all` runs frontend and backend together.
- `npm run type-check` runs `vue-tsc --build --force`.
- `npm run lint` runs ESLint with auto-fix.
- `npm run build` type-checks and builds the Vite app.
- `npm run e2e`, `npm run e2e:ui`, and `npm run e2e:headed` run Playwright tests.
- `npm run db:seed` loads `supabase/seed/master-data-seed.sql`.

## Coding Style & Naming Conventions

Use 2-space indentation, UTF-8, final newlines, and no trailing whitespace as defined in `.editorconfig`. Prefer TypeScript and Vue SFCs. Filenames should be kebab-case where practical, for example `weekly-order-detail.vue` or `use-thread-allocation-fefo.ts`.

Follow `docs/code-standards.md`: keep files focused, use Vietnamese for user-facing UI text, use App UI wrappers instead of raw Quasar controls, and call backend APIs through `fetchApi()` from `src/services/api.ts`.

## Testing Guidelines

Playwright is the active test framework. Put e2e specs under `tests/e2e/` and name them `*.spec.ts`, for example `auth-session-expired.spec.ts`. The Playwright config starts `npm run dev:all` automatically unless an existing server can be reused. Run `npm run e2e` before changes that affect routing, auth, forms, or API behavior.

## Commit & Pull Request Guidelines

Recent history uses short conventional-style subjects, especially `fix:` and scoped forms such as `fix(ReturnGroupDetail): ...`. Keep commits focused and imperative. Before pushing, the Husky pre-push hook runs lint, type-check, build, and e2e tests.

Pull requests should include a clear summary, test evidence, linked issue or task when available, and screenshots for UI changes. Note migrations, environment changes, or data-impacting behavior explicitly.

## Security & Configuration Tips

Copy `.env.example` to `.env` for local setup and never commit secrets. Avoid destructive database commands such as `supabase db reset`, `DROP TABLE`, or `TRUNCATE` unless the data-loss risk has been explicitly approved.
