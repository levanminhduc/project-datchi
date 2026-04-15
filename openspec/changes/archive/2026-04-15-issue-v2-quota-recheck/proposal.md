## Why

The Issue V2 quota validation system has three gaps that allow thread issuance to exceed defined quotas (dinh muc). The `POST /:id/confirm` endpoint compares issued quantities against a stale `quota_cones` snapshot stored when lines were first added to a DRAFT issue, rather than recalculating the live remaining quota at confirm time. Additionally, concurrent DRAFT issues are invisible to each other because all quota queries filter by `status = 'CONFIRMED'`, and batch-lines processing does not accumulate consumption between sibling lines targeting the same thread type. These gaps can cause actual issuance to exceed the quota without any `over_quota_notes`, breaking the quota enforcement contract.

## What Changes

- Add a live quota re-check loop in the `POST /:id/confirm` endpoint that recalculates remaining quota using `batchGetQuotaCones()` at confirm time, replacing the stale `line.quota_cones` comparison.
- Update each line's `quota_cones` value in the database after live recalculation so the stored snapshot reflects the most recent quota state.
- Block confirmation when a line exceeds the live quota and has no `over_quota_notes`; preserve the existing behavior that allows over-quota with notes.
- Fix `POST /:id/batch-lines` to accumulate issued quantities within the same batch so that sibling lines targeting the same `(po_id, style_id, style_color_id, thread_type_id)` see each other's consumption.
- Add a utility function in `issue-v2-batch-quota.ts` that accepts "pending consumption" offsets to include DRAFT-line consumption in the quota calculation.

## Capabilities

### New Capabilities

- `confirm-time-quota-recheck`: Live quota recalculation at confirm time for all issue lines, replacing stale snapshot comparison with fresh `batchGetQuotaCones()` call, and updating stored `quota_cones` values.

### Modified Capabilities

_(none -- no existing spec-level requirements are changing, only the implementation of when and how quota is checked)_

## Impact

- **`server/routes/issuesV2.ts`**: Confirm endpoint (`POST /:id/confirm`) gains a pre-validation loop that calls `batchGetQuotaCones()` and updates lines. Batch-lines endpoint (`POST /:id/batch-lines`) gains intra-batch consumption accumulation.
- **`server/utils/issue-v2-batch-quota.ts`**: New exported function (or parameter extension) to accept pending consumption offsets for quota calculation.
- **No database schema changes**: All changes are in application logic only.
- **No frontend changes**: The API contract remains the same; the confirm endpoint already returns errors in the same format.
- **Backward compatibility**: Existing DRAFT issues with stale `quota_cones` will have their snapshots refreshed upon confirmation.
