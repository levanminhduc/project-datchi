## 1. Database Migration - Lot Sync Trigger

- [x] 1.1 Create migration file `supabase/migrations/2026XXXX_lot_sync_trigger.sql` wrapped in `BEGIN;...COMMIT;` transaction block
- [x] 1.1a All migrations MUST end with `NOTIFY pgrst, 'reload schema';` to ensure PostgREST picks up schema changes immediately
- [x] 1.2 Use idempotent DDL: `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` before create
- [x] 1.3 Create function `fn_sync_lot_available_cones()` that recalculates `lots.available_cones` using explicit predicate: `status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')`
- [x] 1.4 Create trigger `trigger_sync_lot_on_inventory_change` on `thread_inventory` (AFTER INSERT/UPDATE/DELETE) — only fire when `status` or `lot_id` actually changes (use `WHEN` clause or early-return in function)
- [x] 1.5 Handle cone moved between lots using `IS DISTINCT FROM` semantics: when `OLD.lot_id IS DISTINCT FROM NEW.lot_id`, recalculate BOTH old and new lot (handles NULL correctly)
- [x] 1.6 Add logic to update `lots.status`: set DEPLETED when count=0; set ACTIVE only when count>0 AND current status='DEPLETED' (preserve QUARANTINE/EXPIRED) ← (verify: trigger fires correctly, lots.available_cones matches actual COUNT, QUARANTINE lots stay QUARANTINE)

## 2. Data Fix - Sync Existing Lots

- [x] 2.1 Add one-time UPDATE to sync all `lots.available_cones` using explicit predicate `status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')`
- [x] 2.2 Backfill `lots.status` using same logic as trigger: set DEPLETED where count=0, set ACTIVE where count>0 AND status='DEPLETED' (preserve QUARANTINE/EXPIRED) ← (verify: query lots vs inventory counts with same predicate, should match 100%)
- [x] 2.3 Backfill `issued_line_id` for existing HARD_ALLOCATED cones: join `thread_inventory` with `thread_movements` where `movement_type='ISSUE'` and `reference_type='ISSUE_LINE'`; use deterministic tie-break: select movement with MAX(`created_at`); only cast `reference_id::INT` when value matches regex `^[0-9]+$` (use `WHERE reference_id ~ '^[0-9]+$'`); for cones without determinable line_id (legacy data, non-numeric reference_id, or no matching movement), leave `issued_line_id = NULL` and set `is_legacy_unmapped = TRUE`
- [x] 2.3a Add column `thread_inventory.is_legacy_unmapped BOOLEAN DEFAULT FALSE` — this flag indicates cones that predate the `issued_line_id` tracking (FK-safe approach instead of sentinel value)
- [x] 2.3b Add FK constraint `thread_inventory.issued_line_id -> thread_issue_lines(id)` (nullable) for referential integrity
- [x] 2.3c Add CHECK constraint: `(is_legacy_unmapped = FALSE) OR (issued_line_id IS NULL)` — ensures legacy flag implies NULL issued_line_id
- [x] 2.4 Add legacy compatibility rule in Return RPC (Task 5.3): if `issued_line_id IS NULL AND is_legacy_unmapped = TRUE`, allow return validation to pass with thread_type_id match ONLY IF exactly one candidate line exists for that (issue_id, thread_type_id) pair; if multiple candidate lines exist, reject with error "manual reconciliation required" to prevent mis-attribution

## 3. Backend - Auth Context Helper

- [x] 3.1 Create helper function `getPerformedBy(c: Context, confirmedByFromBody?: string)` in `server/routes/issuesV2.ts` that returns `c.get('auth')?.employeeCode` (or `String(c.get('auth')?.employeeId)`) with fallback to `confirmedByFromBody` parameter (parsed from request body in route handler, not read inside helper)

## 4. Database Migration - Issue Movement RPC

- [x] 4.1 Create RPC function `fn_issue_cones_with_movements(p_cone_ids INT[], p_line_id INT, p_performed_by VARCHAR)` using `CREATE OR REPLACE FUNCTION`
- [x] 4.2 RPC input validation: reject if `p_cone_ids` is empty, contains duplicates, or `p_line_id` is NULL — raise exception with clear message
- [x] 4.3 RPC MUST validate cone-line ownership: load `thread_issue_lines(p_line_id).thread_type_id` and verify ALL cones in `p_cone_ids` have matching `thread_type_id` — raise exception on mismatch
- [x] 4.4 RPC MUST use `SELECT ... FOR UPDATE` to lock cones and validate current status is 'AVAILABLE' before update
- [x] 4.5 RPC MUST check `affected_rows == array_length(p_cone_ids)` — if mismatch, raise exception (concurrent modification detected)
- [x] 4.6 RPC updates `thread_inventory.status` to 'HARD_ALLOCATED' for given cone_ids
- [x] 4.6a RPC MUST record cone-to-line mapping: update `thread_inventory.issued_line_id = p_line_id` for each issued cone (add column if not exists) — this enables accurate return validation even when multiple lines have same thread_type_id
- [x] 4.6b Add index `idx_thread_inventory_issued_line_status` on (`issued_line_id`, `status`) WHERE `status = 'HARD_ALLOCATED'` (partial index) — optimizes return validation lookups
- [x] 4.7 RPC inserts movement for each cone with explicit fields: `movement_type='ISSUE'`, `reference_type='ISSUE_LINE'`, `reference_id=p_line_id`, `from_status='AVAILABLE'`, `to_status='HARD_ALLOCATED'`, `quantity_meters` from cone row, `performed_by=p_performed_by`
- [x] 4.8 RPC wraps all operations in single transaction, returns error on any failure (automatic rollback)
- [x] 4.9 RPC security: use `SECURITY DEFINER`, set `search_path = public`, REVOKE EXECUTE FROM PUBLIC, GRANT EXECUTE TO service_role only

## 5. Database Migration - Return Movement RPC

- [x] 5.1 Create RPC function `fn_return_cones_with_movements(p_cone_ids INT[], p_line_id INT, p_performed_by VARCHAR, p_partial_returns JSONB)` using `CREATE OR REPLACE FUNCTION`
- [x] 5.2 RPC input validation: reject if `p_cone_ids` empty/duplicates, invalid JSONB schema, duplicate `original_cone_id` in partials, non-positive `return_quantity_meters`, or quantity exceeds original — raise exception with clear message
- [x] 5.2a RPC MUST enforce set-consistency: verify ALL `original_cone_id` in `p_partial_returns` have status='HARD_ALLOCATED' AND belong to `p_line_id` (cone-line ownership); verify NO overlap between `p_cone_ids` (full-return) and `original_cone_id` set (partial-return) — fail transaction on any violation
- [x] 5.3 RPC MUST validate cone-line ownership: verify ALL cones in `p_cone_ids` have `issued_line_id = p_line_id` (exact line match, not just thread_type_id) — raise exception on mismatch; this prevents attribution errors when multiple lines have same thread type
- [x] 5.4 RPC MUST use `SELECT ... FOR UPDATE` to lock cones and validate current status is 'HARD_ALLOCATED' before update
- [x] 5.5 RPC MUST check `affected_rows == array_length(p_cone_ids)` — if mismatch, raise exception
- [x] 5.6 RPC updates `thread_inventory.status` to 'AVAILABLE' for full-return cone_ids
- [x] 5.7 For partial returns: RPC creates new partial cone with length-safe `cone_id`: if `{original_cone_id}-P{seq}` exceeds 50 chars, use `{truncated_original(38)}-P{seq}` where seq is 0-padded 6 digits from `nextval('thread_inventory_partial_seq')`; `id` column uses `nextval('thread_inventory_id_seq')`; copy attributes from original, set `is_partial=true`, set `quantity_meters` to returned amount, set status='AVAILABLE', set `issued_line_id=NULL`
- [x] 5.8 For partial returns: update original cone's `quantity_meters` = `original - returned` (meter conservation invariant)
- [x] 5.9 RPC inserts movement for each returned cone with explicit fields: `movement_type='RETURN'`, `reference_type='ISSUE_LINE'`, `reference_id=p_line_id`, `from_status='HARD_ALLOCATED'`, `to_status='AVAILABLE'`, `quantity_meters`, `performed_by=p_performed_by`
- [x] 5.10 RPC wraps all operations in single transaction, returns error on any failure (automatic rollback)
- [x] 5.11 RPC security: use `SECURITY DEFINER`, set `search_path = public`, REVOKE EXECUTE FROM PUBLIC, GRANT EXECUTE TO service_role only

## 6. Backend - Call RPCs from issuesV2.ts (Request-Level Handling)

- [x] 6.1 For confirm route with multiple lines: process lines sequentially; if ANY line RPC fails, return error immediately with list of succeeded line_ids in response body (for manual recovery)
- [x] 6.1a Add idempotency support: REQUIRE `idempotency_key` in request body for confirm/return endpoints (reject with 400 if missing); before processing, atomically INSERT row with status='IN_PROGRESS' (using ON CONFLICT to detect concurrent requests); for ALL existing states (IN_PROGRESS, COMPLETED, FAILED), verify `request_hash` matches current payload hash — if mismatch reject with error; if status='COMPLETED' return cached result; if status='FAILED' skip `succeeded_line_ids` and resume from remaining lines; on completion update status='COMPLETED' with `succeeded_line_ids`; on failure update status='FAILED' with `succeeded_line_ids` and error info before returning HTTP error
- [x] 6.1a-schema Update Zod schemas `ConfirmIssueV2Schema` and `ReturnIssueV2Schema` to require `idempotency_key: z.string().uuid()`
- [x] 6.1a-fe Update all FE callers (confirm/return actions): generate UUID via `crypto.randomUUID()` once per operation attempt; persist key in local state (e.g., Pinia store or component ref); on retry (timeout/network error), reuse the SAME key; only generate new key after receiving terminal response (success or non-retryable error); pass as `idempotency_key` in request body
- [x] 6.1b Create table `issue_operations_log(id SERIAL, idempotency_key VARCHAR NOT NULL, operation_type VARCHAR NOT NULL, request_hash VARCHAR(64) NOT NULL, request_payload JSONB, succeeded_line_ids INT[], status VARCHAR DEFAULT 'IN_PROGRESS', created_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ, UNIQUE(operation_type, idempotency_key))` — status enum: IN_PROGRESS, COMPLETED, FAILED; uniqueness scoped by operation_type
- [x] 6.2 Document accepted tradeoff: partial commits possible across lines; full request-level atomicity deferred to v2
- [x] 6.3 Modify `deductStock()` to call `fn_issue_cones_with_movements` RPC instead of direct updates
- [x] 6.4 Identify return route(s) in issuesV2.ts and call `fn_return_cones_with_movements` RPC instead of direct updates
- [x] 6.5 For partial returns: pass `p_partial_returns` JSONB with `{original_cone_id, return_quantity_meters}`, NOT pre-created cone IDs
- [x] 6.6 Pass `getPerformedBy(c, body.confirmed_by)` result as performed_by parameter to RPCs
- [x] 6.7 Handle RPC errors gracefully: if RPC raises exception, log error with line_id and return appropriate HTTP status ← (verify: issue/return operations use RPC, movements logged with all required fields)

## 7. Notification Side Effect Mitigation

- [x] 7.1 Check if `thread_movements` has existing notification triggers: (a) `fn_notify_batch_movement` and (b) `fn_notify_stock_alert`
- [x] 7.2 If batch notification trigger exists: modify to SKIP notifications for `reference_type='ISSUE_LINE'` (chosen strategy: skip, not aggregate)
- [x] 7.3 If stock-alert trigger exists: evaluate if ISSUE_LINE movements should trigger alerts; if not, add same SKIP logic for `reference_type='ISSUE_LINE'`
