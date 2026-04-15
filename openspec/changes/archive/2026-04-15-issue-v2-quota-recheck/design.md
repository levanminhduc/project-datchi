## Context

The Issue V2 system manages thread issuance from warehouses. Each issue starts as DRAFT, where lines are added with a `quota_cones` snapshot (the remaining quota at the time the line was added). When the user confirms the issue, the `POST /:id/confirm` endpoint checks whether issued quantities exceed the stored `quota_cones`. However, this snapshot becomes stale between line creation and confirmation -- other issues may have been confirmed in the interim, consuming quota.

Three validation gaps exist:
1. **Stale snapshot at confirm time** -- `line.quota_cones` is compared but never refreshed.
2. **Concurrent DRAFT invisibility** -- All quota queries filter `thread_issues.status = 'CONFIRMED'`, so two DRAFTs targeting the same thread type both see full remaining quota.
3. **Batch-lines blind spot** -- Sequential line processing in `POST /:id/batch-lines` does not accumulate consumption between sibling lines for the same thread type.

### Key existing functions

- `getQuotaCones()` (issuesV2.ts:763): Single-item live quota calculation. Queries CONFIRMED issues only.
- `batchGetQuotaCones()` (issue-v2-batch-quota.ts:158): Batch version. Takes items[], poId, styleId, colorId, ratio, department. Returns `Map<compositeKey, remainingQuota | null>`.
- `buildIssuedMap()` (issue-v2-batch-quota.ts:55): Aggregates (issued - returned) by compositeKey from query results.
- `computeQuotaPerItem()` (issue-v2-batch-quota.ts:15): Core math: baseQuota - issuedNet per item.
- `calculateIssuedEquivalent()`: Converts (full, partial, ratio) to equivalent cones.
- `compositeKey()` (issue-v2-batch-quota.ts:5): `${threadTypeId}:${threadColorId ?? 'null'}`.

## Goals / Non-Goals

**Goals:**
- Ensure the confirm endpoint recalculates live remaining quota for every line before allowing confirmation.
- Block confirmation when any line exceeds the live quota without `over_quota_notes`.
- Refresh the stored `quota_cones` value in each line upon confirmation so the snapshot is accurate.
- Accumulate intra-batch consumption in `POST /:id/batch-lines` so sibling lines see each other.
- Preserve the existing "over-quota with notes" flow -- intentional over-quota issuance SHALL continue to work.

**Non-Goals:**
- Making DRAFT lines visible to other users' quota calculations (this would contaminate CONFIRMED data accuracy and add significant complexity).
- Adding database-level locking or advisory locks for concurrent confirm operations (the stale-snapshot fix is sufficient for the current usage pattern; true concurrent confirms for the same PO-Style-Color-Thread are rare).
- Modifying the frontend -- the API contract does not change.
- Adding a new database migration or schema change.

## Decisions

### Decision 1: Reuse `batchGetQuotaCones()` at confirm time

**Choice**: Call `batchGetQuotaCones()` for all lines in the issue at the beginning of the confirm endpoint, grouped by (poId, styleId, colorId) to minimize query count.

**Rationale**: `batchGetQuotaCones()` already computes live remaining quota correctly for CONFIRMED issues. It batches multiple thread types per query, which is more efficient than calling `getQuotaCones()` per line. No new query logic is needed.

**Alternative considered**: Creating a new RPC function to do the quota check atomically in PostgreSQL. Rejected because the existing function already works correctly, the check runs inside a single API request, and the risk of truly concurrent confirms for the same quota group is low enough to not warrant the added complexity.

### Decision 2: Group lines by quota context before batch query

**Choice**: Before calling `batchGetQuotaCones()`, group lines by `(po_id, style_id, style_color_id, department)`. Each group gets one `batchGetQuotaCones()` call with all its thread types.

**Rationale**: `batchGetQuotaCones()` expects a single (poId, styleId, colorId) context per call. An issue can contain lines for multiple PO-Style-Color combinations, so grouping ensures correct quota calculation while minimizing the number of DB queries.

### Decision 3: Update `quota_cones` in DB on success path only

**Choice**: Update each line's `quota_cones` field with the live-recalculated value ONLY after ALL validation gates pass (quota re-check AND stock check). The snapshot update is placed on the success path, not between validation steps.

**Rationale**: The spec requires "Snapshot not updated on failed confirm." If snapshot were updated between quota check and stock check, a stock-check failure would leave stale/mutated snapshots in the DB. Placing the update on the success path ensures atomicity of the validation+update sequence.

### Decision 3b: Intra-issue accumulation at confirm time

**Choice**: During the confirm re-check loop, maintain a `pendingConsumption: Map<string, number>` per group. After each line passes validation, add its `issuedEquivalent` to the map. Subsequent lines for the same composite key see the accumulated consumption.

**Rationale**: Without this, two lines in the same issue targeting the same thread type would each pass individually against the same live quota baseline, even though their combined consumption exceeds quota. This is the same class of bug as the batch-lines blind spot (gap #3), applied to the confirm context.

### Decision 4: Add `pendingConsumption` parameter with null-quota protection

**Choice**: Create a wrapper function `batchGetQuotaConesWithPending()` that accepts `pendingConsumption: Map<string, number>`. The wrapper calls `batchGetQuotaCones()`, then for each result: if quota is `null`, keep `null` unchanged; if numeric, subtract pending consumption with lower bound at 0.

**Rationale**: The batch-lines endpoint processes lines sequentially before inserting them all at once. Since `batchGetQuotaCones()` queries the DB, earlier lines in the batch are invisible. Passing pending consumption lets the function subtract those from the quota as well. A wrapper function is preferred over modifying the core function to avoid breaking other callers. The null-quota protection is critical because `null` means "no determinable quota / unconstrained" — accidental arithmetic on `null` would incorrectly enforce or reject lines.

**Alternative considered**: Inserting lines one at a time into the DB as they are validated, then rolling back on failure. Rejected because it requires transaction management that Supabase JS client does not natively support well and increases DB round trips.

### Decision 5: Place the re-check loop before the stock check loop

**Choice**: Insert the live quota re-check after loading lines and before the existing stock availability check loop (around line 3415 in current code).

**Rationale**: Quota violations are a business logic error that should be caught before making any stock-related queries. Failing fast on quota saves unnecessary DB queries for stock.

## Risks / Trade-offs

**[Performance] Additional DB queries at confirm time** -- Each confirm call now requires 1+ `batchGetQuotaCones()` calls (one per unique PO-Style-Color group) plus an UPDATE query.
--> Mitigation: `batchGetQuotaCones()` already batches all thread types per group, so typical issues with 1-2 PO-Style-Color groups add only 1-2 extra queries. The UPDATE is batched. This is negligible compared to the existing stock check queries.

**[Race condition] Two users confirming simultaneously for the same quota** -- Without DB-level locking, two simultaneous confirms could both read the same remaining quota, both pass validation, and both succeed.
--> Mitigation: This is the existing behavior and is extremely unlikely in practice (confirms happen one-at-a-time per issue, and the idempotency key prevents duplicate confirms). Accepting this risk is a deliberate non-goal; true locking can be added later if needed.

**[Backward compatibility] Existing DRAFT issues have stale `quota_cones`** -- When a user confirms an old DRAFT, the live re-check will use fresh data and may reject lines that would have passed with the stale snapshot.
--> Mitigation: This is the correct behavior. If the quota was truly consumed since the DRAFT was created, the user SHOULD be blocked and asked to add over-quota notes. The UX already supports this flow.
