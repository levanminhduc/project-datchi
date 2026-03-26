## Why

The `/new-feature` skill template (`.claude/skills/new-feature/SKILL.md`) has significant inconsistencies with the actual codebase, security gaps in template code, and missing patterns that exist in the real project. A joint review by Claude (codebase research) and Codex/GPT (independent code review) identified ~25 issues across consistency, security, best practices, and completeness. Additionally, `CLAUDE.md` has a response format description that contradicts the actual codebase.

## What Changes

### Consistency fixes in SKILL.md
- Fix response format from `{ data, error }` to `{ data: T|null, error: string|null, message?: string }`
- Fix `ApiResponse` import path from non-existent `server/types/api.ts` to actual `server/types/employee.ts`
- Replace `q-dialog` + `q-card` template with `FormDialog` component (matching the skill's own rule)
- Add `SearchInput` component to list page template (replacing manual AppInput + debounce)
- Add `DeleteDialog` component pattern for delete confirmations
- Fix soft delete template to note schema-dependency (not all tables have `is_active`)
- Add missing `from/to` date filter in backend query template
- Fix detail page: add missing `statusColors`/`statusLabels` declarations, remove unused `useRouter` import
- Remove duplicate route pattern (`ten-tinh-nang.vue` vs `ten-tinh-nang/index.vue`)
- Fix migration basic template to use idempotent `DO $$ BEGIN...EXCEPTION` for CREATE TYPE
- Fix frontend service to import `ApiResponse` from `@/types` instead of local declaration
- Fix Zod validation order: `.trim().min(1)` instead of `.min(1).trim()`

### Security fixes in SKILL.md
- Add `authMiddleware` + `requirePermission` to route templates
- Fix PUT endpoint to validate body through Zod UpdateSchema (prevent mass-assignment)
- Fix RPC template: replace SQLERRM client exposure with generic message
- Add `SET search_path = public` to RPC SECURITY DEFINER template
- Add try-catch for `c.req.json()` parse errors (400 instead of 500)

### Missing patterns to add in SKILL.md
- Add `BEGIN;`/`COMMIT;` wrapper to migration template
- Add `createErrorHandler` factory pattern alongside `getErrorMessage`
- Add auth middleware section with `authMiddleware`, `requirePermission`, `requireAdmin`, `requireRoot`
- Add `IconButton` to component reference table
- Update component table with `SearchInput` and `DeleteDialog`

### CLAUDE.md fix
- Fix response format from `{ success, data?, error?, message? }` to `{ data: T|null, error: string|null, message?: string }` (field `success` does not exist at top-level in any route)

## Capabilities

### New Capabilities
- `skill-consistency`: Fix internal contradictions between skill rules and skill templates
- `skill-security`: Fix security vulnerabilities in template code patterns
- `skill-completeness`: Add missing codebase patterns to skill templates

### Modified Capabilities

(none — no existing openspec specs affected)

## Impact

- **Files modified**: `.claude/skills/new-feature/SKILL.md` (primary), `CLAUDE.md` (1 line fix)
- **Risk**: Low — only modifying documentation/template files, no application code changes
- **Dependencies**: None — changes are self-contained in skill and project docs
