## 1. Fix CLAUDE.md Response Format

- [x] 1.1 Update CLAUDE.md API response format from `{ success, data?, error?, message? }` to `{ data: T|null, error: string|null, message?: string }`

## 2. Fix SKILL.md Database Section (BUOC 1)

- [x] 2.1 Wrap basic migration template in `BEGIN;`/`COMMIT;` block
- [x] 2.2 Replace bare `CREATE TYPE` with idempotent `DO $$ BEGIN...EXCEPTION` pattern in basic template (line 46)
- [x] 2.3 Add `SET search_path = public` to RPC SECURITY DEFINER template (line 95)
- [x] 2.4 Replace `SQLERRM` in RPC EXCEPTION block with generic error message (line 115) ← (verify: RPC template has no info leak, search_path is set)

## 3. Fix SKILL.md Types Section (BUOC 2)

- [x] 3.1 Change backend ApiResponse import from `server/types/api` to `server/types/employee` (line 185)
- [x] 3.2 Update response format references to include `message?` field

## 4. Fix SKILL.md Validation Section (BUOC 3)

- [x] 4.1 Fix Zod chain order from `.min(1).trim()` to `.trim().min(1)` (line 267-268)

## 5. Fix SKILL.md Backend Routes Section (BUOC 4)

- [x] 5.1 Add auth middleware import and usage to route template (after Hono import, line 349)
- [x] 5.2 Add try-catch for `c.req.json()` parse errors in POST/PUT templates (lines 407, 477)
- [x] 5.3 Fix PUT route to validate body through `UpdateSchema.safeParse(body)` instead of raw `body` (line 492)
- [x] 5.4 Add `from/to` date range filter to GET list query builder (after line 380)
- [x] 5.5 Fix soft delete template: add note about checking schema for `is_active` column (line 515)
- [x] 5.6 Update response format in all route examples to include `message?` field
- [x] 5.7 Fix response format rule text (line 640): clarify `{ data, error, message? }` pattern ← (verify: all route templates have auth middleware, validated PUT body, correct response format)

## 6. Fix SKILL.md Service Section (BUOC 5)

- [x] 6.1 Replace local `ApiResponse` interface with import from `@/types` (line 661-665)
- [x] 6.2 Update response format in service examples to match `{ data, error, message? }`

## 7. Fix SKILL.md Composable Section (BUOC 6)

- [x] 7.1 Add `createErrorHandler` factory pattern alongside `getErrorMessage` (after line 757)

## 8. Fix SKILL.md Frontend Page Section (BUOC 7)

- [x] 8.1 Remove duplicate route pattern — keep only `index.vue` pattern (line 885-886)
- [x] 8.2 Replace `AppInput` search + `useDebounceFn` with `SearchInput` component in list page template
- [x] 8.3 Replace `q-dialog` + `q-card` with `FormDialog` component in list page template (line 1162)
- [x] 8.4 Fix detail page: add `statusColors`/`statusLabels` declarations, remove unused `useRouter` import (lines 1216-1260)
- [x] 8.5 Add `DeleteDialog` usage pattern to list page template ← (verify: list page template uses SearchInput, FormDialog, DeleteDialog; detail page has all declarations)

## 9. Fix SKILL.md Component Reference Section (QUY TAC BAT BUOC)

- [x] 9.1 Add `SearchInput` to component reference table (line 1379+)
- [x] 9.2 Add `DeleteDialog` to component reference table
- [x] 9.3 Add `IconButton` to component reference table
- [x] 9.4 Add auth middleware pattern section to backend rules

## 10. Fix SKILL.md Checklist Section

- [x] 10.1 Update response format in checklist from `{ data, error }` to `{ data, error, message? }` (line 1519)
- [x] 10.2 Add auth middleware check to backend checklist
- [x] 10.3 Add Zod validation check to PUT endpoint in backend checklist
- [x] 10.4 Update soft delete checklist item to note `is_active` schema dependency
- [x] 10.5 Add `BEGIN;`/`COMMIT;` check to migration checklist ← (verify: all checklist items match updated templates, no stale references remain)
