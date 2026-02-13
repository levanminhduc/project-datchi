## 1. Backend — New Endpoints

- [x] 1.1 Add `POST /api/issues/v2/validate-line` endpoint (same logic as `/:id/lines/validate` but without requiring issue_id in URL)
- [x] 1.2 Add `POST /api/issues/v2/create-with-lines` endpoint that creates issue header + first line in a single transaction
- [x] 1.3 Add Zod schema `CreateIssueWithLineSchema` for the combined create request validation

## 2. Frontend — Types & Service

- [x] 2.1 Add `CreateIssueWithLineDTO` type to `src/types/thread/issueV2.ts`
- [x] 2.2 Add `createWithFirstLine()` method to `src/services/issueV2Service.ts`
- [x] 2.3 Update `validateLine()` in service to call new `/validate-line` endpoint when no issue_id exists
- [x] 2.4 Update `getFormData()` in service to work without issue_id parameter

## 3. Frontend — Composable

- [x] 3.1 Add `createIssueWithFirstLine()` method to `src/composables/thread/useIssueV2.ts` that calls the new combined endpoint

## 4. Frontend — Page Flow

- [x] 4.1 Change `handleCreateIssue()` to only save local state (no API call), show Step 2 immediately
- [x] 4.2 Update `canLoadThreadTypes` computed to not require `hasIssue`
- [x] 4.3 Update `handleAddLine()` to detect first-line scenario and call `createIssueWithFirstLine()` instead of `addLine()`
- [x] 4.4 Update UI visibility conditions: Step 2 (PO/Style/Color) shows based on local state flag, not `hasIssue`
- [x] 4.5 Update `handleLoadFormData()` to work without issue_id
- [x] 4.6 Update validate calls in the page to use the issue-id-free path when no issue exists
