## Context

The Issue V2 system manages thread issuance for garment production. The current flow creates a database record (`thread_issues` table, status=DRAFT) as soon as the user enters Department + Creator, before they select any PO/Style/Color or add thread lines. This produces empty draft records that appear in the history list, confusing users and cluttering the data.

Current architecture:
- **Backend**: `server/routes/issuesV2.ts` — Hono routes for CRUD, form-data, validate, confirm
- **Frontend**: `src/pages/thread/issues/v2/index.vue` — tabbed page (Create + History)
- **Composable**: `src/composables/thread/useIssueV2.ts` — state management
- **Service**: `src/services/issueV2Service.ts` — API client
- **Types**: `src/types/thread/issueV2.ts` — TypeScript interfaces

Current API dependencies on `issue_id`:
- `GET /api/issues/v2/form-data?issue_id=X&po_id=Y&style_id=Z&color_id=W` — issue_id is in the query but not actually used in the business logic (only po/style/color matter for loading thread types)
- `POST /api/issues/v2/:id/lines/validate` — issue_id is in the URL path but not used in validation logic (only thread_type_id and quantities matter)

## Goals / Non-Goals

**Goals:**
- Defer issue creation until the first thread line is added
- Every issue in history has at least 1 line of thread data
- Maintain the same user experience (3-step flow: dept/creator → PO/style/color → thread lines)
- Create issue + first line atomically (single transaction if possible)

**Non-Goals:**
- Changing the database schema or adding migrations
- Modifying the history/list page behavior
- Changing the confirm/return flow
- Adding new validation rules

## Decisions

### Decision 1: New combined endpoint vs sequential API calls

**Chosen: New endpoint `POST /api/issues/v2/create-with-lines`**

This endpoint accepts department, created_by, and the first line data in a single request. It creates the issue header and the first line within a single database transaction.

**Why not sequential calls:**
- Sequential calls (create → addLine) have a failure window where the issue exists without lines — the exact problem we're solving
- A combined endpoint ensures atomicity

### Decision 2: Decouple form-data and validate from issue_id

**Chosen: Make issue_id optional in form-data and validate endpoints**

Analysis of the backend code shows:
- `form-data` endpoint uses `po_id`, `style_id`, `color_id` to load thread types and stock — `issue_id` is not used in the query logic
- `validate` endpoint uses `thread_type_id`, `issued_full`, `issued_partial`, `po_id`, `style_id`, `color_id` — `issue_id` is not used in calculation

**Approach**: Add new routes without `:id` prefix:
- `GET /api/issues/v2/form-data` (already works without issue_id in query)
- `POST /api/issues/v2/validate-line` (new route, same logic)

Keep existing `:id/lines/validate` route for backward compatibility.

### Decision 3: Frontend local state management

**Chosen: Use reactive refs for pre-issue state**

Before the issue is created, `department` and `createdBy` are already stored as `ref()` in `index.vue`. The change is minimal:
- `handleCreateIssue()` → becomes `handleProceedToStep2()`, sets a `step2Visible` flag, no API call
- `handleAddLine()` → checks if `hasIssue`, if not, calls `createIssueWithFirstLine()` first
- `canLoadThreadTypes` → no longer requires `hasIssue`

## Risks / Trade-offs

- **[Risk] User abandons at Step 2/3 after "creating" locally** → No issue created in DB (this is the desired behavior — no orphan records)
- **[Risk] Race condition on first addLine click** → Mitigated by disabling the add button during the create+addLine call via loading state
- **[Trade-off] Slightly more complex first-line flow** → Acceptable given the clear benefit of no empty drafts
