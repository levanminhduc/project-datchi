## Context

The V2 issue system manages thread cone issuance and returns. Currently, returns are tracked via counter increments on `thread_issue_lines` (`returned_full`, `returned_partial`). The `POST /api/issues/v2/:id/return` endpoint validates quantities, restores inventory (HARD_ALLOCATED → AVAILABLE via `addStock()`), and increments counters. No individual transaction records exist.

The composable `useReturnV2` manages state via `fetchApi` calls directly (not through `issueV2Service`). The `return.vue` page uses `AppSelect` for issue selection and `q-table` for displaying lines with return inputs.

## Goals / Non-Goals

**Goals:**
- Record each return transaction with timestamp for audit trail
- Display return history per issue on the return page
- Minimal changes to existing return flow — log insertion is additive

**Non-Goals:**
- Editing or deleting return logs (immutable audit trail)
- Displaying return history on other pages (history page, dashboard)
- User authentication tracking (`created_by` stored but not enforced — nullable for now)

## Decisions

### 1. Separate log table vs. PostgreSQL audit log
**Decision**: New `thread_issue_return_logs` table
**Rationale**: A dedicated table allows easy querying with JOINs to thread info (name, color). PostgreSQL audit triggers would be harder to query and display in the UI. The table also allows future extensions (e.g., adding `created_by`, notes).

### 2. Log granularity: per-line vs. per-transaction
**Decision**: Per-line logging — one row per line per return transaction
**Rationale**: Users want to see which specific threads were returned and how many. A per-transaction log would require a separate detail table, adding unnecessary complexity. Grouping by `created_at` timestamp achieves transaction-level grouping when needed.

### 3. Frontend data loading: eager vs. lazy
**Decision**: Load return logs when issue is selected (same trigger as loading issue details)
**Rationale**: Return history is always visible when an issue is selected. Lazy loading (e.g., expand/collapse) adds UI complexity for minimal benefit given the expected small number of return transactions per issue.

### 4. Log insertion: inside existing transaction vs. separate
**Decision**: Insert logs in the same endpoint handler as the counter increment, sequentially
**Rationale**: Keeps atomicity simple — if the return succeeds, the log is created. If the log INSERT fails, the return still succeeds (log is best-effort, not critical path).

## Risks / Trade-offs

- **[Historical data gap]** → Existing returns before this change will have no log entries. Mitigation: Accept this — the history section simply shows "no history" for pre-existing returns. No backfill needed.
- **[Log INSERT failure]** → If log INSERT fails but return succeeds, history is incomplete. Mitigation: Log the error server-side but don't fail the return operation. The counters on `thread_issue_lines` remain the source of truth.
