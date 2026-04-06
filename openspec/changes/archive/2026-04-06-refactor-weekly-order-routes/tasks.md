## 1. Create directory and helpers module

- [x] 1.1 Create directory `server/routes/weekly-order/`
- [x] 1.2 Create `server/routes/weekly-order/helpers.ts` — extract from `server/routes/weeklyOrder.ts` lines 30-134: `formatZodError()`, `VALID_STATUS_TRANSITIONS`, `validateSubArtIds()`, `validatePOQuantityLimits()`. Add new `getPerformerName(c: Context<AppEnv>): Promise<string>` extracted from 4 duplicated auth-to-employee lookup patterns (returns `full_name` or `'He thong'` fallback). Export all as named exports. (~150 lines) <- (verify: all 4 helpers + 1 constant exported, `getPerformerName` has correct fallback behavior)

## 2. Create core routes module

- [x] 2.1 Create `server/routes/weekly-order/core.ts` — new `Hono<AppEnv>()` instance with 8 routes. Import helpers from `./helpers`. Route order: static paths first (`GET /check-name`, `GET /assignment-summary`), then parameterized (`GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/status`), and list route (`GET /`). Copy handler bodies exactly from `weeklyOrder.ts`. Remove stale comments (`// Task X.Y:`, `// ISSUE-N FIX:`). Replace duplicated performer-name lookups with `getPerformerName(c)`. Export default. (~700 lines) <- (verify: route order has static paths before `/:id`, all 8 routes present, handler bodies unchanged except DRY extraction and comment cleanup)

## 3. Create calculation routes module

- [x] 3.1 Create `server/routes/weekly-order/calculation.ts` — new `Hono<AppEnv>()` instance with 6 routes. Route order: `POST /enrich-inventory`, `PUT /items/:id/quota`, `GET /ordered-quantities` before parameterized `POST /:id/results`, `GET /:id/results`, `GET /:id/thread-summary-live`. Copy handler bodies exactly. Remove stale comments. Export default. (~700 lines) <- (verify: route order correct, all 6 routes present, handler bodies unchanged except comment cleanup)

## 4. Create deliveries routes module

- [x] 4.1 Create `server/routes/weekly-order/deliveries.ts` — new `Hono<AppEnv>()` instance with 5 routes. Route order: `GET /deliveries/overview`, `PATCH /deliveries/:deliveryId`, `POST /deliveries/:deliveryId/receive`, `GET /history-by-week` before `GET /:id/deliveries`. Copy handler bodies exactly. Remove stale comments. Replace duplicated performer-name lookups with `getPerformerName(c)`. Export default. (~750 lines) <- (verify: route order correct, all 5 routes present, handler bodies unchanged except DRY extraction and comment cleanup)

## 5. Create loans-reservations routes module

- [x] 5.1 Create `server/routes/weekly-order/loans-reservations.ts` — new `Hono<AppEnv>()` instance with 18 routes. Route order: static paths first (`POST /completion-lookup`, `POST /batch-complete`, `GET /loans/summary`, `GET /loans/all`, `GET /loans/:loanId/return-logs`), then parameterized `/:id` and `/:weekId` routes. Copy handler bodies exactly. Remove stale comments. Replace duplicated performer-name lookups with `getPerformerName(c)`. Export default. (~800 lines) <- (verify: route order correct, all 18 routes present — count must match, handler bodies unchanged except DRY extraction and comment cleanup)

## 6. Create index and wire up

- [x] 6.1 Create `server/routes/weekly-order/index.ts` — create main `Hono<AppEnv>()`, mount sub-routers in order: `coreRoutes`, `calculationRoutes`, `deliveryRoutes`, `loansReservationsRoutes` (all via `.route('/', subRouter)`). Add comment documenting mount-order constraint. Export default. (~40 lines)
- [x] 6.2 Update `server/index.ts` line 32 — change import from `'./routes/weeklyOrder'` to `'./routes/weekly-order'`
- [x] 6.3 Delete `server/routes/weeklyOrder.ts` <- (verify: `server/routes/weeklyOrder.ts` no longer exists, `server/index.ts` imports from `./routes/weekly-order`, all 28 routes are reachable via the new module structure)

## 7. Verify

- [x] 7.1 Run `npm run type-check` — must pass with zero errors
- [x] 7.2 Run `npm run lint` — must pass with zero errors <- (verify: both type-check and lint pass cleanly, confirming all imports resolve and no dead code remains)
