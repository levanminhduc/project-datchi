## 1. Database Migration

- [x] 1.1 Create `sub_arts` table with columns: id (SERIAL PK), style_id (FK to styles ON DELETE CASCADE), sub_art_code (VARCHAR(100) NOT NULL), created_at (TIMESTAMPTZ DEFAULT NOW())
- [x] 1.2 Add UNIQUE constraint on (style_id, sub_art_code)
- [x] 1.3 Add index on sub_arts.style_id
- [x] 1.4 Add nullable `sub_art_id` column to `thread_issue_lines` with FK to sub_arts(id) ON DELETE RESTRICT. Include `NOTIFY pgrst, 'reload schema'` at end of migration ← (verify: migration runs clean, FK constraints correct, sub_arts referenced by issue lines cannot be deleted, PostgREST recognizes new FK)

## 2. Backend - SubArt API

- [x] 2.1 Create Zod validation schemas in `server/validation/subArts.ts`: ImportSubArtSchema, SubArtQuerySchema
- [x] 2.2 Create `server/routes/subArts.ts` with GET `/api/sub-arts?style_id=X` endpoint (list sub_arts by style, ordered by sub_art_code)
- [x] 2.3 Add POST `/api/sub-arts/import` endpoint — parse Excel (ExcelJS), match style_code to styles, insert sub_arts, skip duplicates, return summary (imported/skipped/warnings)
- [x] 2.4 Register subArts routes in `server/index.ts` ← (verify: GET returns correct data, import handles all scenarios from spec — unmatched style_code, duplicates, empty file)

## 3. Backend - Issue V2 Integration

- [x] 3.1 Modify `GET /api/issues/v2/order-options` — after extracting unique style IDs, fetch sub_arts presence in a single query: `SELECT DISTINCT style_id FROM sub_arts WHERE style_id IN (list)`, map to Set, add `has_sub_arts: set.has(style.id)` to each style option (avoid N+1)
- [x] 3.2 Modify `AddIssueLineV2Schema`, `CreateIssueWithLineSchema`, AND `ValidateIssueLineV2Schema` in `server/validation/issuesV2.ts` to accept optional `sub_art_id` (number, nullable)
- [x] 3.3 Modify `POST /api/issues/v2/:id/lines` — add `sub_art_id` to destructured variables AND insert payload. Validate: if style has sub_arts then sub_art_id required, if provided must belong to given style_id, if style has NO sub_arts but sub_art_id provided → 400. After insert, fetch sub_art_code from sub_arts if sub_art_id stored, include in response
- [x] 3.4 Modify `POST /api/issues/v2/create-with-lines` — same as 3.3: add `sub_art_id` to destructured variables + insert + validation + fetch sub_art_code for response
- [x] 3.5 Modify `GET /api/issues/v2/:id` — add `sub_arts(id, sub_art_code)` to nested select to include sub_art_code in line response
- [x] 3.6 Modify `POST /api/issues/v2/validate-line` — add sub_art_id validation matching 3.3 logic ← (verify: order-options returns has_sub_arts flag without N+1, line creation validates sub_art_id correctly for ALL scenarios including validate-line pre-check, responses include sub_art_code)

## 4. Frontend - Types & Service

- [x] 4.1 Add SubArt types in `src/types/thread/subArt.ts`: SubArt interface, ImportSubArtResult interface
- [x] 4.2 Create `src/services/subArtService.ts` with getByStyleId(styleId) and importExcel(file) methods using fetchApi
- [x] 4.3 Update `OrderOptionStyle` type in `src/types/thread/issueV2.ts` to include `has_sub_arts: boolean`
- [x] 4.4 Update `AddIssueLineV2DTO` and `CreateIssueWithLineDTO` types to include optional `sub_art_id`
- [x] 4.5 Update `IssueLineV2` base interface to include `sub_art_id?: number | null`, and `IssueLineV2WithComputed` to include optional `sub_art_code` ← (verify: types match backend response shapes, base interface has sub_art_id, computed has sub_art_code)

## 5. Frontend - Issue V2 SubArt Dropdown

- [x] 5.1 Modify `src/pages/thread/issues/v2/index.vue` — add `selectedSubArtId` ref and `subArtOptions` ref. Update `handleNewIssue()` to also clear `selectedSubArtId` and `subArtOptions`
- [x] 5.2 Add SubArt AppSelect dropdown between Style and Color selects, conditionally rendered when selected style has `has_sub_arts=true`
- [x] 5.3 Add watcher: when selectedStyleId changes, check has_sub_arts → if true fetch sub_arts via subArtService.getByStyleId(), if false clear subArtOptions and skip
- [x] 5.4 Update Color watcher — Color loading still uses PO + Style (unchanged), but SubArt must be selected first if required
- [x] 5.5 Pass sub_art_id to createIssueWithFirstLine() and addLine() calls
- [x] 5.6 Add SubArt column to added-lines table (show sub_art_code if present) ← (verify: dropdown shows/hides correctly based on has_sub_arts, selection clears on style change, sub_art_id sent to backend)

## 6. Frontend - Issue V2 Detail Display

- [x] 6.1 Modify `src/pages/thread/issues/v2/[id].vue` — add sub_art_code to formatOrderInfo display in the lines table (show "PO / Style / SubArt / Color" when sub_art_code exists, using existing ` / ` separator) ← (verify: SubArt displays in detail view when present, hidden when null)

## 7. Frontend - SubArt Import Page

- [x] 7.1 Create `src/pages/thread/sub-arts/index.vue` — import page with file upload (accept .xlsx), parse results display (imported/skipped/warnings table)
- [x] 7.2 Add navigation entry for SubArt import page ← (verify: full import flow works — upload Excel, see results, data appears in DB and issue dropdown)
