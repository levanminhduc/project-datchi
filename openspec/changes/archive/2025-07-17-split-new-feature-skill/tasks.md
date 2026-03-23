## 1. Create /new-db skill

- [x] 1.1 Create `.claude/skills/new-db/` directory
- [x] 1.2 Create `.claude/skills/new-db/SKILL.md` with: skill header, migration templates (basic table, ENUM, add ENUM value), RPC function template, view template, audit trigger template, naming conventions (snake_case, v_, fn_, idx_, UPPERCASE enums, COMMENT ON), and DB checklist ← (verify: all migration templates from original Step 1 are present, no content missing, conventions match original)

## 2. Create /new-be skill

- [x] 2.1 Create `.claude/skills/new-be/` directory
- [x] 2.2 Create `.claude/skills/new-be/SKILL.md` with: skill header, BE types template (Row/DTO/Filters + shared ApiResponse import), Zod validation template (.safeParse pattern, handleValidation helper, advanced patterns), route registration in index.ts
- [x] 2.3 Add Hono route templates: Level 1 Simple CRUD (GET list with pagination/filters, POST create with duplicate check, GET/:id, PUT/:id with exists check, DELETE/:id soft delete), Level 2 Workflow (status transitions), Level 3 reference, RPC call pattern, cascading /options endpoint
- [x] 2.4 Add route ordering rules (static → list → create → nested → /:id → PUT → DELETE → action), auth/permission pattern (global auth via except, requirePermission per route), response format rules ({data, error, message?} NOT {success}), notification integration, and BE checklist ← (verify: all route templates from original Steps 2-4 present, route ordering rule included, auth pattern matches original, checklist complete)

## 3. Create /new-fe skill

- [x] 3.1 Create `.claude/skills/new-fe/` directory
- [x] 3.2 Create `.claude/skills/new-fe/SKILL.md` with: skill header, FE types template (enum, interfaces, DTO, Filters, ListResponse, barrel export), service client template (fetchApi, buildQueryString, all CRUD methods)
- [x] 3.3 Add composable template (instance-level default pattern with useLoading/useSnackbar/createErrorHandler, module-level shared state pattern, Vietnamese MESSAGES const)
- [x] 3.4 Add list page template (index.vue with definePage, PageHeader, SearchInput, AppSelect filters, DatePicker, DataTable with server-side pagination, FormDialog, DeleteDialog, permission checks, status badges, tab layout, handleRequest)
- [x] 3.5 Add detail page template ([id].vue with route params, fetchById, PageHeader showBack, tab panels, formatted display)
- [x] 3.6 Add optional feature templates: Realtime (useRealtime subscribe/unsubscribeAll), Excel export (dynamic import ExcelJS, styled headers, download blob)
- [x] 3.7 Add UI component rules table (AppInput/AppSelect/AppButton/DataTable/DatePicker/PageHeader/FormDialog/DeleteDialog/SearchInput/IconButton with props, import paths), general rules (Vietnamese messages, DD/MM/YYYY, vi-VN numbers, file-based routing, usePermission, getErrorMessage, useConfirm), cascading selects pattern, and FE checklist
- [x] 3.8 Add multi-agent FE parallelization guide: fe-core (Types + Service + Composable) → fe-page (Pages, Realtime, Excel) with dependency ordering ← (verify: all templates from original Steps 5-9 present, UI component rules complete, checklist covers both state and UI sections, multi-agent guide included)

## 4. Rewrite /new-feature as orchestrator

- [x] 4.1 Rewrite `.claude/skills/new-feature/SKILL.md` with: skill header, Step 0 requirement analysis (interpret in Vietnamese, scope detection DB/BE/FE/All, complexity Level 1-3, user confirmation)
- [x] 4.2 Add decision tree: DB only → /new-db, BE only → /new-be, FE only → /new-fe (optional multi-agent), DB+BE → TeamCreate, Full-stack → TeamCreate with all agents
- [x] 4.3 Add team orchestration guide: TeamCreate → TaskCreate with dependencies → agent prompt template ("Read .claude/skills/new-X/SKILL.md") → coordinate → verify → shutdown → cleanup
- [x] 4.4 Add execution order reference (10 steps mapped to layer skills), cross-layer rules (API flow, Vietnamese, no comments, date/number format), and skill sync maintenance note ← (verify: orchestrator is ~200 lines, contains NO layer-specific templates, decision tree covers all scope combinations, agent prompt template includes pre-code rules, 10-step mapping is complete)

## 5. Validation

- [x] 5.1 Verify all 4 skill files exist and are valid SKILL.md format
- [x] 5.2 Verify no content from original /new-feature is lost — cross-reference original Steps 0-9 + rules + checklist against the 4 new files ← (verify: open original SKILL.md side-by-side, ensure every template, convention, and checklist item exists in exactly one of the 4 new skills)
