## Context

The weekly order summary table (`ResultsSummaryTable.vue`) displays aggregated thread demand per type/color. The "Nhu Cầu" (demand) column shows `total_cones` — a read-only value computed as `ceil(total_meters / meters_per_cone)`. Downstream fields `sl_can_dat` and `total_final` derive from this value.

Infrastructure for `quota_cones` already exists:
- `AggregatedRow` type has `quota_cones` field
- `useWeeklyOrderCalculation.ts` has `updateQuotaCones()` (sets value only, no recalc)
- `weeklyOrderService.ts` has `updateQuotaCones()` API call
- `index.vue` already binds `@update:quota-cones` event
- `save-results.ts` persists `quota_cones` in JSONB `summary_data`

Current bug: `save-results.ts:80` overwrites user's `quota_cones` with recalculated value on every save. `enrich-helper.ts` ignores `quota_cones` for `sl_can_dat` computation.

## Goals / Non-Goals

**Goals:**
- Allow users to override the demand value while results are unsaved (!readonly)
- Show original vs overridden values clearly inline
- Require a justification note when increasing demand
- Persist overrides through save/load/confirm cycles
- Recalculate downstream fields correctly using the override

**Non-Goals:**
- Auto-deducting pending supplier deliveries from demand
- Changing warehouse selection logic
- Adding new DB columns or migrations (JSONB is sufficient)
- Modifying the calculation engine itself

## Decisions

### 1. Override mechanism: `quota_cones` field

Use the existing `quota_cones` field as the user override. Display `quota_cones ?? total_cones` as the effective demand. Keep `total_cones` as the original calculated value.

**Why:** Infrastructure already exists (type, composable, service, event binding). No new fields needed for the core override.

**Alternative considered:** Overwriting `total_cones` directly — rejected because it loses the original calculated value, making it impossible to show the diff.

### 2. Inline display format: `80 (gốc: 100)`

When `quota_cones` differs from `total_cones`, display the override value followed by the original in parentheses. Use a distinct style (e.g., `text-orange`) to signal the cell has been modified.

**Why:** User confirmed this format. It's compact and shows both values at a glance without needing tooltips.

### 3. Mandatory note on increase only

Add `demand_note` field to `AggregatedRow`. The note is mandatory only when `quota_cones > total_cones` (increasing demand). Decreasing is allowed without a note since it's a conservative action.

**Why:** Increasing demand means ordering more inventory — this needs justification for audit/traceability. Decreasing is self-explanatory (user knows they have stock or NCC is delivering).

### 4. Frontend-side recalculation after override

When user changes `quota_cones`, recalculate `sl_can_dat` and `total_final` immediately on the frontend:
```
sl_can_dat = max(0, ceil(effectiveCones - equivalent_cones))
total_final = sl_can_dat + additional_order
```

The backend `enrich-helper.ts` also uses `quota_cones ?? total_cones` so that re-enrichment (on save) produces consistent results.

**Why:** Keeps the formula identical to current logic, just swapping the input value. No new computation patterns.

### 5. Preserve `quota_cones` on save — never synthesize

Fix `save-results.ts` to preserve the user's non-null `quota_cones`. Do NOT populate `quota_cones` with a calculated value for rows without user override — leave it null. Only rows where the user explicitly edited demand will have `quota_cones` set.

**Why:** Current code unconditionally overwrites `quota_cones`, which would destroy user overrides on every save. Synthesizing calculated values for non-overridden rows creates stale-default-as-override bugs on subsequent loads.

### 6. Remove direct debounced API call

Remove the debounced `weeklyOrderService.updateQuotaCones()` API call from `handleUpdateQuotaCones`. Quota changes are persisted only through the save/confirm flow (JSONB `summary_data`). This eliminates race conditions between debounced API calls and the canonical save path.

**Why:** The direct API endpoint is color-less and note-less. It can fire during idle and persist partial state, conflicting with the save-results path. The save/confirm flow already handles persistence correctly.

## Risks / Trade-offs

- **Risk: User sets unreasonable demand** → Mitigation: Mandatory note on increase provides audit trail. No hard cap — user is trusted for business decisions.
- **Risk: Stale override after recalculation** → Mitigation: When user recalculates (changes PO/style/quantity and clicks "Tính toán"), `quota_cones` is preserved in snapshot and restored after recalc. The `(gốc: X)` display updates to show the new calculated value, making staleness visible.
- **Risk: JSONB field proliferation** → Mitigation: Only adding `demand_note` (string). `quota_cones` already exists. JSONB handles this naturally.
