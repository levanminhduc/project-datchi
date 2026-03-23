## 1. Database Migration

- [x] 1.1 Add `sub_art_id` nullable column (FK to `sub_arts.id`) to `thread_order_items`
- [x] 1.2 Drop existing unique constraint `(week_id, po_id, style_id, color_id)`
- [x] 1.3 Create new unique index on `(week_id, COALESCE(po_id, 0), style_id, color_id, COALESCE(sub_art_id, 0))` ← (verify: migration runs without errors, existing data unaffected, duplicate with different sub_art_id allowed)

## 2. Backend Types & Validation

- [x] 2.1 Add `sub_art_id?: number | null` to `ThreadOrderItem`, `CreateWeeklyOrderDTO.items[]`, `UpdateWeeklyOrderDTO.items[]` in `server/types/weeklyOrder.ts`
- [x] 2.2 Add `sub_art_id: z.number().int().positive().nullable().optional()` to `OrderItemSchema` in `server/validation/weeklyOrder.ts`

## 3. Backend Routes

- [x] 3.1 Update GET `/api/weekly-orders/:id` SELECT query to include `sub_art_id` and join `sub_art:sub_arts (id, sub_art_code)` in item select
- [x] 3.2 Update POST `/api/weekly-orders` to include `sub_art_id` in `itemRows` mapping
- [x] 3.3 Update PUT `/api/weekly-orders/:id` to include `sub_art_id` in item upsert
- [x] 3.4 Add `validateSubArtId()` helper: check sub_art_id exists in `sub_arts` and belongs to correct style_id (reference `issuesV2.ts` pattern)
- [x] 3.5 Call `validateSubArtId()` in POST and PUT routes before insert ← (verify: valid sub_art accepted, invalid rejected with 400, null sub_art passes)

## 4. Frontend Types

- [x] 4.1 Add `sub_art_id?: number | null` and `sub_art_code?: string` to `StyleOrderEntry` in `src/types/thread/weeklyOrder.ts`
- [x] 4.2 Add `sub_art_id?: number | null` and `sub_art?: { id: number; sub_art_code: string }` to `ThreadOrderItem` in `src/types/thread/weeklyOrder.ts`

## 5. Composable (useWeeklyOrderCalculation)

- [x] 5.1 Update `entryKey(poId, styleId)` → `entryKey(poId, styleId, subArtId)` with format `${poId}_${styleId}_${subArtId}`
- [x] 5.2 Update `addStyle()` to accept `sub_art_id` and `sub_art_code` params, include in new entry and entryKey check
- [x] 5.3 Update all `entryKey()` call sites to pass `sub_art_id` (addStyle, removeStyle, existing lookups)
- [x] 5.4 Add sub-art validation to `canCalculate` computed: entries where style has sub-arts MUST have sub_art_id set
- [x] 5.5 Add `subArtRequired` reactive Map (styleId → boolean) for tracking which styles need sub-art
- [x] 5.6 Update `setFromWeekItems()` to restore `sub_art_id` and `sub_art_code` from loaded items, using updated entryKey
- [x] 5.7 Ensure `buildBatchInputs()` still groups by `style_id` only — NO changes needed, just verify ← (verify: entryKey works with sub_art_id, canCalculate blocks when sub-art missing, setFromWeekItems restores sub-art correctly)

## 6. Frontend UI (StyleOrderCard)

- [x] 6.1 Add `subArts` ref and fetch via `subArtService.getByStyleId(styleId)` on mount
- [x] 6.2 Show AppSelect dropdown for sub-art when `subArts.length > 0`, with `sub_art_code` as label
- [x] 6.3 Emit sub-art selection to parent (update StyleOrderEntry.sub_art_id/sub_art_code)
- [x] 6.4 Register style's sub-art requirement in composable's `subArtRequired` map
- [x] 6.5 Handle read-only state for deleted sub-arts (when loading saved week with sub_art_id but sub-art not in dropdown options)

## 7. Weekly Order Page Integration

- [x] 7.1 Update `addStyle` calls in POOrderCard/page to pass sub_art_id when applicable
- [x] 7.2 Update "Tính toán" button disabled tooltip to include sub-art warning message
- [x] 7.3 Include `sub_art_id` in save payload (items array sent to POST/PUT) ← (verify: full flow works — add style with sub-art → select sub-art → add colors → calculate → save → reload shows correct sub-art)
