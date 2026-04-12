## Context

The weekly order confirmation flow in `server/routes/weekly-order/core.ts` currently performs all operations in a single PATCH /:id/status endpoint: confirm status, reserve thread cones via RPC, sync deliveries, broadcast in-app notifications, and dispatch external notifications. Three bugs in this monolithic flow cause orders to appear confirmed while actually missing reservations or data:

1. When the RPC `fn_reserve_cones_for_week` returns error code 42883 (function not found or signature mismatch), the catch block sets `lastError = null` and breaks out of the retry loop, falling through to the generic status update at line 1377 — resulting in CONFIRMED status with zero reservations.
2. In the frontend, `saveResults` in `useWeeklyOrder.ts` catches errors internally and returns null, but `handleConfirmWeek` in `index.vue` does not check this return value — confirmation proceeds with unsaved order line data.
3. The frontend uses a 10-second default timeout for the confirmation API call, but the backend RPC can take longer. The frontend shows an error toast while the database has already committed the confirmation.

## Goals / Non-Goals

**Goals:**
- Eliminate silent data loss by making every error in the confirmation flow visible and blocking
- Split the monolithic PATCH endpoint into atomic, independently retriable steps
- Provide real-time progress feedback to the user during the multi-step confirmation
- Enable safe retries via idempotent confirmation endpoint
- Ensure the frontend timeout exceeds the backend processing time for the confirmation RPC

**Non-Goals:**
- Changing the RPC function `fn_reserve_cones_for_week` itself — the reservation logic is correct when the function exists and is called properly
- Adding database-level saga/transaction coordination across the split endpoints — each step is independently safe
- Modifying the cancellation flow — only the confirmation path is affected
- Adding WebSocket/SSE for real-time progress — polling or sequential calls are sufficient for 4 steps

## Decisions

### 1. Split confirmation into 4 sequential frontend-driven steps instead of backend orchestration

**Choice**: Frontend drives 4 sequential API calls (save -> confirm+reserve -> sync-deliveries -> notify) with a progress dialog.

**Alternative considered**: Backend orchestration endpoint that performs all 4 steps and returns progress via SSE or polling. Rejected because: (a) adds complexity with SSE/polling infrastructure the project does not currently use, (b) each step is already a separate concern with independent error modes, (c) frontend-driven approach allows the user to see exactly which step failed and retry from that point.

**Rationale**: The frontend already has the context for each step. Sequential calls with per-step error handling is simpler and maps directly to the user's mental model of what confirmation does.

### 2. Keep confirm+reserve as a single atomic step via existing RPC

**Choice**: The PATCH /:id/status endpoint continues to call `fn_reserve_cones_for_week` as part of confirmation. It does NOT split confirm and reserve into separate endpoints.

**Alternative considered**: Separate PATCH /status (just set CONFIRMED) and POST /reserve (call RPC). Rejected because the RPC is designed to be atomic — setting status and reserving cones in one transaction prevents a window where status is CONFIRMED but no reservation has been attempted.

**Rationale**: The atomicity of confirm+reserve is correct. The bug is in the error handling, not the coupling.

### 3. Fix RPC error 42883 by returning 500 instead of silent fallthrough

**Choice**: When the RPC returns error code 42883, return `c.json({ data: null, error: 'RPC function error' }, 500)` instead of setting lastError=null and breaking.

**Alternative considered**: Retry with a different function signature. Rejected because 42883 indicates a deployment/schema issue that retrying will not fix.

**Rationale**: This is the core bug. The fallthrough allowed the generic status update code at line 1377 to run, setting status=CONFIRMED without any reservation. Making it a hard error forces the issue to be surfaced immediately.

### 4. Idempotent confirmation check for safe retries

**Choice**: At the start of the PATCH /:id/status handler, when the requested status is CONFIRMED and the week's current status is already CONFIRMED, return 200 with the current data instead of attempting re-confirmation.

**Rationale**: This enables the frontend's retry-on-timeout pattern. If the backend confirmed but the response was lost due to timeout, the frontend can re-call and get a success response without side effects.

### 5. ConfirmProgressDialog as a reusable step-progress component

**Choice**: Create a component that accepts an array of step definitions and renders them with status icons (pending/loading/success/error). The component is passive — it does not drive the steps, only displays them.

**Alternative considered**: Inline the progress UI directly in index.vue. Rejected because it would bloat an already large page file and the step-progress pattern may be reusable.

**Rationale**: Separation of display (ConfirmProgressDialog) from orchestration (index.vue handleConfirmWeek) follows Vue composition patterns used throughout the project.

### 6. Use fetchApi timeout option for the 60s confirmation timeout

**Choice**: Extend the `weeklyOrderService.updateStatus` call to pass `{ timeout: 60000 }` via fetchApi options. If fetchApi does not currently support a timeout option, add AbortController-based timeout support.

**Alternative considered**: A global timeout increase. Rejected because only the confirmation RPC needs extended time.

**Rationale**: Per-request timeout is more surgical. The 60s value provides margin over the observed backend processing time while still failing reasonably fast if the backend is truly stuck.

## Risks / Trade-offs

**[Risk] Network failure between steps leaves partial state** — After step 2 (confirm+reserve) succeeds but step 3 (sync-deliveries) fails, the order is confirmed but deliveries are not synced. Mitigation: Each step is independently retriable. The user can retry the failed step. The sync-deliveries and notify endpoints check that status=CONFIRMED before executing, so they are safe to call multiple times. A manual "retry sync" capability could be added later if needed.

**[Risk] fetchApi may not currently support per-request timeout** — The codebase uses a standard fetchApi wrapper. Mitigation: Check the current fetchApi implementation. If timeout is not supported, add it via AbortController (standard pattern). This is a small, contained change.

**[Risk] Race condition if two users confirm the same week simultaneously** — Mitigation: The existing RPC uses SKIP LOCKED, and the new idempotent check will return success for the second caller. The split endpoints (sync-deliveries, notify) are also safe to call multiple times.

**[Trade-off] More API calls per confirmation (4 instead of 1)** — Accepted because reliability and user visibility outweigh the minor latency increase. Each additional call is lightweight (sync-deliveries reads existing data, notify fires and forgets).
