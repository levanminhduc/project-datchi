## Why

Currently, when a user enters Department + Creator and clicks "Tạo Phiếu Xuất", the system immediately creates a DRAFT issue record in the database (via `POST /api/issues/v2`). This creates empty issues that appear in the history list even though no thread lines have been added — the user hasn't selected PO → Style → Color or loaded any thread types yet. These empty drafts pollute the history and don't represent real work.

The fix is to defer issue creation until the user adds their first thread line, ensuring every issue in history has at least one line of actual data.

## What Changes

- **Defer API call**: The "Tạo Phiếu Xuất" button will only save Department + Creator to local state (no API call). The UI proceeds to Step 2 (PO/Style/Color selection) immediately.
- **Create-with-first-line**: When the user adds their first thread line, the system creates the issue header AND the first line in a single transaction (new backend endpoint or sequential calls).
- **Decouple form-data/validate from issue_id**: The `GET /api/issues/v2/form-data` and `POST /api/issues/v2/:id/lines/validate` endpoints currently require an `issue_id` in the URL path. Since no issue exists yet at that point, these need to work without an issue_id.
- **UI flow adjustment**: The create tab UI shows Step 2 (PO/Style/Color) based on local state rather than `hasIssue` check. The `hasIssue` check moves to Step 3 (thread type table) area.

## Capabilities

### New Capabilities
- `defer-issue-creation`: Defers issue record creation until the first thread line is added, including backend endpoint changes and frontend flow refactoring.

### Modified Capabilities

## Impact

- **Backend**: `server/routes/issuesV2.ts` — new endpoint or modified create endpoint to accept first line data; form-data and validate endpoints decoupled from issue_id
- **Frontend**: `src/pages/thread/issues/v2/index.vue` — UI flow changes (local state for dept/creator, deferred API call)
- **Frontend**: `src/composables/thread/useIssueV2.ts` — new `createIssueWithFirstLine()` method
- **Frontend**: `src/services/issueV2Service.ts` — new service method + updated form-data/validate calls
- **Types**: `src/types/thread/issueV2.ts` — new DTO for create-with-line
- **No DB migration needed** — table structure stays the same
