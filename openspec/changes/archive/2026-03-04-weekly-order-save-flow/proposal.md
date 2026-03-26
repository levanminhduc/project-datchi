## Why

Current Weekly Order UX requires users to save the week first, then reload it from history before they can confirm. This creates unnecessary friction. Additionally, when users enter a duplicate week name, they get an error after attempting to save instead of being warned early.

## What Changes

- Move "Lưu tuần" button from WeekInfoCard to Result Actions (next to "Xác nhận tuần")
- Enable "Xác nhận tuần" immediately after successful save (no reload required)
- Add duplicate week name check on input blur with confirmation dialog
- Set `selectedWeek.value` after creating new week to enable confirm button

## Capabilities

### New Capabilities
- `check-week-name`: Backend endpoint to check if a week name already exists, returns existing week info if found

### Modified Capabilities
- None (this is UI/UX improvement, no spec-level requirement changes)

## Impact

- **Backend**: `server/routes/weeklyOrder.ts` - new endpoint `GET /weekly-orders/check-name`
- **Frontend Service**: `src/services/weeklyOrderService.ts` - new `checkWeekNameExists()` function
- **Frontend UI**: `src/pages/thread/weekly-order/index.vue` - button relocation, blur handler, dialog logic
- **Component**: `src/components/thread/weekly-order/WeekInfoCard.vue` - remove actions slot usage (optional)
