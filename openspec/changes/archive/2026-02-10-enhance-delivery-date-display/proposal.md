## Why

The delivery date column in `ResultsDetailView.vue` currently shows a static DD/MM/YYYY date that cannot be edited inline. Users need to adjust delivery dates before saving results, and after saving, they need a quick countdown view ("còn N Ngày") instead of raw dates. Additionally, saved delivery dates should be locked from editing except for root/admin users to prevent accidental changes.

## What Changes

- Replace static date display in ResultsDetailView with inline DatePicker for editing delivery_date before saving
- Change display format from DD/MM/YYYY to "còn N Ngày" countdown (delivery_date minus today) after results are saved
- Show "Đã đến hạn Giao" when countdown reaches 0 or goes negative
- Lock delivery_date column to read-only after save, with override for root and admin roles
- Pass edited delivery_date values through to the save API (local-only changes until save)

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `delivery-tracking`: The detail table delivery date column changes from static display to inline-editable (pre-save) with countdown display (post-save) and role-based locking

## Impact

- **Frontend**: `ResultsDetailView.vue` — major UI changes to delivery_date column (DatePicker, countdown, role check)
- **Frontend**: `useWeeklyOrderCalculation.ts` — support local delivery_date edits before save
- **Frontend**: Parent page `index.vue` — pass `isSaved` state to ResultsDetailView
- **Auth**: Uses existing `useAuth().isAdmin()` and `isRoot()` for role-based edit permission
- **Backend**: No changes needed — existing save endpoint already persists delivery_date from summary_data
