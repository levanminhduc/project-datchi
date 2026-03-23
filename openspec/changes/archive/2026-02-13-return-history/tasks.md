## 1. Database

- [x] 1.1 Create migration `supabase/migrations/20260213_return_logs.sql` with `thread_issue_return_logs` table (id, issue_id FK, line_id FK, returned_full, returned_partial, created_by nullable, created_at). Add index on issue_id.

## 2. Backend

- [x] 2.1 Add `GET /api/issues/v2/:id/return-logs` endpoint in `server/routes/issuesV2.ts` — query `thread_issue_return_logs` JOIN `thread_issue_lines` JOIN `thread_types` to include thread_name, thread_code, and LEFT JOIN colors for color_name. Order by created_at DESC. Return 404 if issue not found.
- [x] 2.2 Modify `POST /api/issues/v2/:id/return` endpoint in `server/routes/issuesV2.ts` — after successfully updating `thread_issue_lines` counters, INSERT one row per return line into `thread_issue_return_logs`. Log INSERT failure server-side but do not fail the return operation.

## 3. Frontend Types

- [x] 3.1 Add `ReturnLog` interface to `src/types/thread/issueV2.ts` with fields: id, issue_id, line_id, returned_full, returned_partial, created_by, created_at, thread_name, thread_code, color_name.

## 4. Frontend Composable

- [x] 4.1 Add `returnLogs` ref and `loadReturnLogs(issueId)` method to `src/composables/thread/useReturnV2.ts`. The method calls `GET /api/issues/v2/:id/return-logs` via fetchApi and populates the ref.

## 5. Frontend Page

- [x] 5.1 Update `src/pages/thread/issues/v2/return.vue` — import and use `returnLogs` and `loadReturnLogs` from composable. Call `loadReturnLogs` when issue is selected (in the existing watch on selectedIssueId), clear logs when deselected. Reload logs after successful return submission.
- [x] 5.2 Add return history q-table below the action buttons card in `return.vue`. Columns: Lần (sequence number), Loại chỉ (thread_code + thread_name + color_name), Nguyên (returned_full), Lẻ (returned_partial), Thời gian (HH:mm DD/MM/YYYY using Quasar date.formatDate). Show "Chưa có lịch sử trả kho" when empty.
