## 1. Fix Color Display in Completion Checklist

- [x] 1.1 In `src/pages/thread/weekly-order/[id].vue`, change line 172 aria-label from `item.color?.name` to `item.style_color?.color_name`
- [x] 1.2 In `src/pages/thread/weekly-order/[id].vue`, change line 178 display text from `item.color?.name || '-'` to `item.style_color?.color_name || '-'` ← (verify: color names render correctly for all items, no "-" placeholders when color exists)

## 2. Types — Extend SurplusPreview

- [x] 2.1 In `src/types/thread/weeklyOrder.ts`, add `SurplusBreakdownItem` interface: `{ thread_type_id: number, supplier_name: string, tex_number: string, color_name: string, own_cones: number, borrowed_cones: number, borrowed_groups: SurplusBorrowedGroup[] }`
- [x] 2.2 In `src/types/thread/weeklyOrder.ts`, add `SurplusBorrowedGroup` interface: `{ original_week_id: number, week_name: string, count: number, action: 're-reserve' | 'release' }`
- [x] 2.3 In `src/types/thread/weeklyOrder.ts`, add optional `breakdown?: SurplusBreakdownItem[]` field to existing `SurplusPreview` interface ← (verify: types compile with `npm run type-check`)

## 3. Backend — Enhance Surplus Preview Endpoint

- [x] 3.1 In `server/routes/weeklyOrder.ts`, enhance `GET /:id/surplus-preview` endpoint: after existing total_cones count, add a grouped query on `thread_inventory` WHERE `reserved_week_id = weekId` AND `status = 'RESERVED_FOR_ORDER'`, selecting `thread_type_id` and `original_week_id` for all matching cones
- [x] 3.2 Join `thread_types` → `suppliers` (supplier name) and `thread_types` → `colors` (color name) + `tex_number` to get display info per thread type
- [x] 3.3 For cones with `original_week_id IS NOT NULL AND original_week_id ≠ weekId`, batch-fetch all distinct original week IDs in one query to get their `status` and `week_name`
- [x] 3.4 Build breakdown array: group by `thread_type_id`. Per group, count own cones (`original_week_id IS NULL` OR `= weekId` OR original week not CONFIRMED) and borrowed cones (original week CONFIRMED). Build `borrowed_groups` with week name and action.
- [x] 3.5 Return breakdown in response alongside existing fields. Wrap breakdown logic in try-catch — on failure, return response without breakdown field (fallback per D3) ← (verify: endpoint returns correct breakdown for weeks with mixed own/borrowed cones, correct fallback on error, no N+1 queries)

## 4. Frontend — Enhance Surplus Preview Dialog

- [x] 4.1 In `src/pages/thread/weekly-order/[id].vue`, update the surplus dialog template: when `surplusPreview.breakdown` exists and has items, render a `q-markup-table` with columns NCC, Tex, Màu, Cuộn riêng, Cuộn mượn
- [x] 4.2 Below the table, show a summary: total own cones released to KD, total borrowed cones returned (with per-week destination if any)
- [x] 4.3 When `surplusPreview.breakdown` is undefined or empty, keep existing simple message display ("Sẽ trả X cuộn...") ← (verify: dialog renders correctly for both breakdown and fallback modes, borrowed column shows 0 when no borrowed cones, Vietnamese labels correct)

## 5. Validation

- [x] 5.1 Run `npm run type-check` — no TypeScript errors
- [x] 5.2 Run `npm run lint` — no ESLint errors ← (verify: both checks pass cleanly)
