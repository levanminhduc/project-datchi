## Context

The Weekly Thread Order page manages a PO → Style → Color → Quantity flow. The `sub_arts` table already exists (created for Issue V2), with `subArtService.getByStyleId()` and `/api/sub-arts` routes available. Some styles have sub-art variants configured; the business needs to track which sub-art each weekly order entry belongs to.

Current state:
- `thread_order_items` has columns: `id, week_id, po_id, style_id, color_id, quantity, created_at`
- Unique constraint: `(week_id, po_id, style_id, color_id)`
- `entryKey` function: `${poId}_${styleId}` — one entry per PO+Style
- `canCalculate` only checks if any color has quantity > 0
- Sub-art is NOT referenced anywhere in the weekly order flow

## Goals / Non-Goals

**Goals:**
- Allow sub-art selection per style entry (conditional — only when style has sub-arts)
- Enforce mandatory sub-art selection before calculation for sub-art-required styles
- Persist sub_art_id in thread_order_items for tracking
- Support multiple entries for same PO+Style with different sub-arts
- Restore sub-art selection when loading saved weeks

**Non-Goals:**
- Sub-art does NOT affect calculation logic (informational only)
- No changes to `buildBatchInputs` or `CalculationInput` types
- No sub-art management UI (already exists in Sub-art module)
- No retroactive migration of existing order data

## Decisions

### D1: Sub-art at Style Entry Level
Each `StyleOrderEntry` gets one optional sub-art. When a style has sub-arts configured, the dropdown appears and selection is mandatory.

**Alternative considered:** Sub-art at color level — rejected because sub-art is a style-level concept, not color-level.

### D2: entryKey Includes sub_art_id
Change from `${poId}_${styleId}` to `${poId}_${styleId}_${subArtId}`.

This enables the same PO+Style to have multiple entries with different sub-arts. The `addStyle` function checks this key for duplicate prevention.

**Alternative considered:** Keep old entryKey + separate sub-art tracking — rejected because it creates complex state management and doesn't support the unique constraint change cleanly.

### D3: Nullable sub_art_id Column
`thread_order_items.sub_art_id` is nullable (INTEGER, FK to `sub_arts.id`). Existing data retains NULL. The unique constraint becomes `(week_id, po_id, style_id, color_id, sub_art_id)` using `COALESCE(sub_art_id, 0)` for NULL handling.

**Alternative considered:** NOT NULL with default 0 — rejected because it requires backfilling existing data and doesn't have a real sub_arts row for id=0.

### D4: Frontend Sub-art Fetching Strategy
Use `subArtService.getByStyleId(styleId)` per style entry (already cached in the service). The `StyleOrderCard` component fetches sub-arts when mounted or when style changes. Empty result = no sub-art dropdown shown.

**Alternative considered:** Bulk fetch all sub-arts upfront — rejected because the existing per-style API is simple and already works.

### D5: canCalculate Validation Gate
The `canCalculate` computed property adds a check: for every entry where `hasSubArts` is true, `sub_art_id` must be set. If any entry violates this, `canCalculate` returns false and the "Tính toán" button shows a tooltip.

### D6: Read-Only for Deleted Sub-arts
When loading a saved week, if a sub_art_id references a deleted sub-art, the entry shows the sub-art as read-only text. No editing of old weeks' sub-art assignments.

### D7: Sub-art State in StyleOrderEntry
Add fields to `StyleOrderEntry`: `sub_art_id?: number | null`, `sub_art_code?: string`. These are set when user selects from the dropdown, and restored from `setFromWeekItems`.

## Data Flow

```
StyleOrderCard (UI)
  ├── onMount: subArtService.getByStyleId(styleId) → subArts[]
  ├── IF subArts.length > 0 → show AppSelect dropdown
  ├── user selects sub-art → emit('update:subArt', { sub_art_id, sub_art_code })
  └── parent updates StyleOrderEntry.sub_art_id/sub_art_code

canCalculate computed:
  ├── existing: entry.colors.some(c => c.quantity > 0)
  └── NEW: && entries with sub-arts all have sub_art_id selected

Save flow:
  ├── items[].sub_art_id included in POST/PUT payload
  └── backend validates sub_art_id exists (if provided)

Load flow (setFromWeekItems):
  ├── thread_order_items now returns sub_art_id + sub_art join
  └── entryKey uses sub_art_id → correct grouping
```

## Risks / Trade-offs

- **[Unique constraint with NULL]** COALESCE approach means (poId, styleId, colorId, NULL) and (poId, styleId, colorId, NULL) still conflict correctly → Mitigation: use functional index `COALESCE(sub_art_id, 0)`
- **[Sub-art cache invalidation]** If sub-arts are imported/deleted while user is on the order page, the dropdown may be stale → Mitigation: acceptable for MVP; user can refresh page
- **[Migration safety]** Adding nullable column + dropping/recreating unique constraint on existing table → Mitigation: migration is non-destructive, nullable column has no default issues, constraint drop+recreate is atomic in a transaction
