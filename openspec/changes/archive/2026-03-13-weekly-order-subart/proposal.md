## Why

The Weekly Thread Order page currently has no awareness of Sub-art (sub-article) variants within a style. Some styles have multiple sub-arts configured in the `sub_arts` table, and business needs to track which sub-art each order entry belongs to. Without this, operators cannot distinguish orders for different sub-art variants of the same style, leading to incorrect inventory planning.

## What Changes

- Add `sub_art_id` (nullable FK) column to `thread_order_items` table
- Update unique constraint from `(week_id, po_id, style_id, color_id)` to `(week_id, po_id, style_id, color_id, sub_art_id)` — enabling same style+color to be ordered for different sub-arts
- Backend routes accept and return `sub_art_id` for weekly order items
- Frontend `StyleOrderCard` shows a conditional Sub-art dropdown (only when the selected style has sub-arts configured)
- `canCalculate` validation gate blocks the "Tính toán" button when any entry with a sub-art-required style has no sub-art selected
- `entryKey` changes from `${poId}_${styleId}` to `${poId}_${styleId}_${subArtId}` to support multiple sub-art entries per style
- Sub-art is **informational only** — does NOT affect thread calculation logic (`buildBatchInputs` still groups by `style_id`)
- Existing sub-art infrastructure reused: `sub_arts` table, `subArtService.getByStyleId()`, `/api/sub-arts` routes

## Capabilities

### New Capabilities
- `weekly-order-subart`: Conditional sub-art selection at style-entry level in Weekly Thread Order, with validation gate and persistence

### Modified Capabilities
(none — no existing specs are changing at requirement level)

## Impact

- **Database**: `thread_order_items` schema change (new column + unique constraint migration)
- **Backend**: `server/routes/weeklyOrder.ts` (accept/return sub_art_id), `server/validation/weeklyOrder.ts` (Zod schema update), `server/types/weeklyOrder.ts` (type update)
- **Frontend**: `src/types/thread/weeklyOrder.ts`, `src/composables/thread/useWeeklyOrderCalculation.ts` (entryKey, addStyle, canCalculate, setFromWeekItems), `src/components/thread/weekly-order/StyleOrderCard.vue` (sub-art dropdown UI), `src/pages/thread/weekly-order/index.vue` (tooltip update)
- **No breaking changes** — sub_art_id is nullable, existing data unaffected
