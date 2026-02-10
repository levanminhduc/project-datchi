## Context

The `ResultsDetailView.vue` component displays per-style calculation results including a "Ngày giao" (delivery date) column. Currently, this column shows a static DD/MM/YYYY formatted date computed during calculation (today + supplier lead_time_days). Users cannot edit this date before saving, and after saving it always shows the raw date format.

The parent page (`index.vue`) manages the weekly order workflow: select styles → calculate → review results → save. The save action calls `POST /api/weekly-orders/:id/results` which persists calculation_data and summary_data, and auto-creates delivery records in `thread_order_deliveries`.

Auth system provides `useAuth()` composable with `isRoot()` and `isAdmin()` functions for role checking.

## Goals / Non-Goals

**Goals:**
- Allow inline editing of delivery_date in ResultsDetailView before saving
- Display countdown format ("còn N Ngày") instead of DD/MM/YYYY after save
- Show "Đã đến hạn Giao" when delivery date has passed
- Lock delivery_date editing after save (except root/admin roles)
- Keep changes local until save action persists them

**Non-Goals:**
- "Đã Giao" status display (separate change, pending warehouse confirmation feature)
- Changes to the `/deliveries` management page
- Changes to backend API endpoints
- Recalculating delivery_date at save time (keep calculation-time date)

## Decisions

### 1. Local state for delivery_date edits

**Decision**: Store edited delivery_dates in a reactive Map within the composable, keyed by a unique row identifier (spec_id or combination of thread_type_id + supplier_id). The edited values override the calculated values in the UI. On save, the edited values are merged into calculation_data/summary_data before calling the API.

**Rationale**: This avoids mutating the original calculation results. The Map approach allows sparse overrides — only edited dates are tracked. On save, the merge is straightforward.

**Alternative considered**: Mutating calculation results directly. Rejected because it conflates calculated vs user-edited values.

### 2. Countdown display format

**Decision**: After save, the "Ngày giao" column displays:
- `còn N Ngày` — when delivery_date > today (N = days remaining)
- `Đã đến hạn Giao` — when delivery_date ≤ today and status is pending

**Rationale**: Countdown is more actionable than a raw date. Users can instantly see urgency.

**Display logic**: `Math.ceil((deliveryDate - today) / 86400000)` for days remaining. Use `date-fns` `differenceInDays` if available, otherwise manual calculation.

### 3. Role-based edit locking

**Decision**: Pass `isSaved` boolean prop to ResultsDetailView. When `isSaved=true`, the delivery_date column is read-only UNLESS `useAuth().isAdmin()` or `useAuth().isRoot()` returns true.

**Rationale**: Uses existing auth infrastructure. No new permissions needed. Root and admin can always override as business requires.

### 4. Inline DatePicker UX

**Decision**: Use Quasar's `q-popup-proxy` with `DatePicker` component (project's existing pattern) triggered by clicking the date cell. Show the current delivery_date value formatted as DD/MM/YYYY when editable.

**Rationale**: Consistent with the project's established DatePicker pattern documented in CLAUDE.md.

### 5. Identifying which rows to edit

**Decision**: Use `spec_id` from `CalculationItem` as the unique key for the delivery_date override Map. Each row in the detail table has a unique `spec_id`.

**Rationale**: `spec_id` is already used as `row-key` in the QTable. It uniquely identifies each calculation row.

## Risks / Trade-offs

- **[Risk]** Edited delivery_dates lost on recalculation → **Mitigation**: When `calculateAll()` is called again, clear the override Map and show a notification that dates were reset. User can re-edit before saving.
- **[Risk]** Countdown display loses date context → **Mitigation**: Show actual date in a tooltip on hover over the countdown text.
- **[Risk]** `isSaved` state determination → **Mitigation**: The parent page already loads saved results via `loadResults()`. If results exist for the week, `isSaved = true`.
