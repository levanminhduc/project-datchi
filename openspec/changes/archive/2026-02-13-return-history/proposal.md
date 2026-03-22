## Why

The V2 issue return system currently tracks returns by incrementing `returned_full` and `returned_partial` counters on `thread_issue_lines`. This means there is no record of individual return transactions — users cannot see when returns happened, how many cones were returned each time, or who performed them. Business needs visibility into return history per issue for accountability and audit purposes.

## What Changes

- Add a new database table `thread_issue_return_logs` to record each return transaction with timestamps
- Modify the existing `POST /api/issues/v2/:id/return` endpoint to INSERT log records alongside the existing counter increments
- Add a new `GET /api/issues/v2/:id/return-logs` endpoint to fetch return history for an issue
- Add a return history table to the `return.vue` page, displayed below the return input form when an issue is selected
- History shows: sequence number, thread name/color, full cones returned, partial cones returned, and timestamp (HH:mm DD/MM/YYYY)

## Capabilities

### New Capabilities
- `return-logs`: Recording and displaying per-transaction return history for V2 issues, including log storage, API retrieval, and frontend display

### Modified Capabilities

## Impact

- **Database**: New table `thread_issue_return_logs` with FK to `thread_issues` and `thread_issue_lines`
- **Backend**: `server/routes/issuesV2.ts` — modify return endpoint + add new GET endpoint
- **Frontend types**: `src/types/thread/issueV2.ts` — add `ReturnLog` interface
- **Composable**: `src/composables/thread/useReturnV2.ts` — add return logs state and fetch method
- **Page**: `src/pages/thread/issues/v2/return.vue` — add history table below return form
