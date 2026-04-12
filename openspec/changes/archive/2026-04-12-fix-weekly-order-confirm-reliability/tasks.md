## 1. Fix PATCH /:id/status endpoint (Backend)

- [x] 1.1 In `server/routes/weekly-order/core.ts`, fix the RPC error 42883 catch block: replace the `lastError = null; break` pattern with `return c.json({ data: null, error: 'RPC function error: ...' }, 500)` so the request fails loudly instead of falling through to the generic status update
- [x] 1.2 Add idempotent check at the top of the CONFIRMED branch in PATCH /:id/status: if the week's current status is already CONFIRMED, return 200 with current week data without re-executing the reservation RPC
- [x] 1.3 Remove broadcastNotification, dispatchExternalNotification, and syncDeliveries calls from the PATCH /:id/status CONFIRMED branch — these will move to dedicated endpoints
- [x] 1.4 Verify the fallthrough code at line ~1377 (generic status update) only executes for non-CONFIRMED statuses (e.g., CANCELLED) by adding a guard or restructuring the control flow (verify: RPC error 42883 returns 500, idempotent re-confirm returns 200, CONFIRMED branch no longer calls sync/notify)

## 2. Add sync-deliveries endpoint (Backend)

- [x] 2.1 In `server/routes/weekly-order/core.ts`, add POST /:id/sync-deliveries route with requirePermission('thread.allocations.manage'). Place it BEFORE the generic /:id route to respect Hono route ordering
- [x] 2.2 Implement the handler: guard that week status is CONFIRMED (return 400 if not), read thread_order_results.summary_data, call syncDeliveries(), return `{ data: { synced: true }, error: null }`
- [x] 2.3 Test that calling POST /:id/sync-deliveries for a non-confirmed week returns 400 (verify: endpoint exists, guard works, syncDeliveries is called correctly for confirmed weeks)

## 3. Add notify endpoint (Backend)

- [x] 3.1 In `server/routes/weekly-order/core.ts`, add POST /:id/notify route with requirePermission('thread.allocations.manage'). Place it BEFORE the generic /:id route
- [x] 3.2 Implement the handler: guard that week status is CONFIRMED (return 400 if not), read reservation data from thread_order_results for itemCount/totalQuantity, call broadcastNotification and dispatchExternalNotification('ORDER_CONFIRMED'), return `{ data: { notified: true }, error: null }` (verify: endpoint exists, guard works, both in-app and external notifications are dispatched)

## 4. Add service methods (Frontend)

- [x] 4.1 In `src/services/weeklyOrderService.ts`, add `syncDeliveries(id: number)` method that calls POST `/api/thread/weekly-order/${id}/sync-deliveries` via fetchApi
- [x] 4.2 In `src/services/weeklyOrderService.ts`, add `notifyConfirmation(id: number)` method that calls POST `/api/thread/weekly-order/${id}/notify` via fetchApi
- [x] 4.3 In `src/services/weeklyOrderService.ts`, update the `updateStatus` method to accept an optional timeout parameter and pass it to fetchApi as AbortController-based timeout. Check `src/services/api.ts` fetchApi implementation first — if it already supports timeout/signal options, use that; if not, implement AbortController timeout inline in the service method (verify: all 3 service methods exist, timeout parameter works with 60s for confirmation calls)

## 5. Fix error propagation in composable

- [x] 5.1 In `src/composables/thread/useWeeklyOrder.ts`, locate the saveResults function and ensure errors are propagated: after catching the error and showing snackbar, re-throw the error (or change return type so handleConfirmWeek can detect failure via null return value check) (verify: when saveResults fails, handleConfirmWeek in index.vue stops the confirmation flow and does not proceed to status update)

## 6. Create ConfirmProgressDialog component

- [x] 6.1 Create `src/components/thread/weekly-order/ConfirmProgressDialog.vue` with props: modelValue (boolean for v-model), steps (array of { label: string, status: 'pending' | 'loading' | 'success' | 'error', errorMessage?: string })
- [x] 6.2 Implement the dialog body: render each step as a row with status icon (circle for pending, QSpinner for loading, checkmark for success, X for error), step label, and optional error message. Use AppDialog for the modal wrapper
- [x] 6.3 Add AppProgress bar showing overall completion percentage (completed steps / total steps * 100)
- [x] 6.4 Implement dismissal rules: disable persistent=false (no click-outside close) and hide close button while any step has status 'loading'. Show "Dong" AppButton only when all steps are 'success' or any step is 'error' with no step 'loading'
- [x] 6.5 All text in Vietnamese: step labels, button text, error prefix (verify: component renders correctly with all 4 step states, dismissal rules enforced, progress bar updates)

## 7. Rewrite handleConfirmWeek in page

- [x] 7.1 In `src/pages/thread/weekly-order/index.vue`, add ConfirmProgressDialog import and reactive state for dialog visibility and steps array with 4 entries: "Luu don hang", "Xac nhan & dat truoc chi", "Dong bo giao hang", "Gui thong bao"
- [x] 7.2 Rewrite handleConfirmWeek: open the dialog, then execute steps sequentially. Step 1: call handleSave (or saveResults directly), update step status. Step 2: call weeklyOrderService.updateStatus(id, 'CONFIRMED', { timeout: 60000 }), on timeout/error call weeklyOrderService.get(id) to check actual status — if CONFIRMED treat as success. Step 3: call weeklyOrderService.syncDeliveries(id). Step 4: call weeklyOrderService.notifyConfirmation(id)
- [x] 7.3 For each step: update the steps array status to 'loading' before call, 'success' after, 'error' with message on failure. If any step fails, stop execution (do not proceed to next step)
- [x] 7.4 After all 4 steps succeed: update local state, clearAll, fetchWeeks, show success via useSnackbar
- [x] 7.5 Remove the old confirmingWeek ref and replace its usage with the dialog visibility ref (verify: full confirmation flow works end-to-end with progress dialog, each failure mode stops correctly, timeout retry detects already-confirmed state, old confirmingWeek ref removed)
