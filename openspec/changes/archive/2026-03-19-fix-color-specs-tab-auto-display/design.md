## Context

The Style detail page (`thread/styles/[id]`) has three tabs:
1. **Thông tin chung** — style metadata
2. **Định mức chỉ** — thread specs (TEX-level: process + supplier + thread type + meters/unit)
3. **Định mức màu** — per-color thread overrides (which thread color for each style_color × spec combination)

Current state of `StyleColorSpecsTab.vue`:
- `colorGroups` computed builds from `usedColorIds` = DB records + manually added colors
- Users must click "Thêm màu hàng" to add each color to the view before assigning thread colors
- `handleColorSpecEdit` only sends `thread_color_id`, never `thread_type_id`
- Result: colors without DB records don't appear → calculation engine warns about missing specs → falls back to TEX-level defaults

The parent page `[id].vue` already loads ALL `styleColors` (active) and passes them as props. The data is available — the component just doesn't use it.

## Goals / Non-Goals

**Goals:**
- All active style_colors auto-display in color specs grid when specs exist (zero manual steps)
- Thread type resolution works correctly (no false fallback to TEX-level defaults)
- Cleaner UX: remove unnecessary "add existing color" workflow

**Non-Goals:**
- Changing the calculation engine logic (`threadCalculation.ts`) — it already handles `thread_type_id` correctly via fallback
- Modifying the "Định mức chỉ" tab behavior
- Adding new DB columns or migrations
- Changing how style_colors are created (that stays in tab 1 or "Tạo màu hàng mới")

## Decisions

### D1: Build colorGroups from all active styleColors
**Choice**: Replace `usedColorIds` filter with `props.styleColors.filter(c => c.is_active)`
**Rationale**: The data is already loaded and passed as props. Currently `usedColorIds` = DB + manual, which requires user action. Using all active colors makes the grid complete automatically.
**Alternative**: Keep usedColorIds but auto-populate via `ensureColorSpecs` on backend — rejected because it creates unnecessary DB records and adds complexity.

### D2: Remove manual "Thêm màu hàng" dialog
**Choice**: Remove `showAddColorDialog`, `selectedNewColorId`, `addedColors` state and the "Thêm" button. Keep only "Tạo màu hàng mới" (creates a new `style_color` record).
**Rationale**: Since all colors auto-display, there's nothing to "add to view". The only legitimate action is creating a genuinely new color.

### D3: Resolve thread_type_id from supplier thread catalog
**Choice**: When user selects a thread color in `handleColorSpecEdit`, look up the matching `thread_type_id` from the supplier's thread types (already cached in `supplierColorsCache`) and send both `thread_color_id` and `thread_type_id` to the API.
**Rationale**: The calculation engine checks `colorSpec.thread_type_id` to decide if a color has specific thread config. Without it, every color falls back to TEX-level defaults, making the color spec tab effectively useless for calculation purposes.
**Implementation note**: The supplier's color catalog links colors to thread_types. When a color is selected, the thread_type that owns that color is the correct `thread_type_id`.

### D4: Simplify unmappedColors
**Choice**: Remove the `unmappedColors` warning banner entirely. Since all colors auto-display, the concept of "unmapped" (no DB record) is irrelevant — the grid shows the color row regardless.
**Rationale**: The warning was a symptom of the manual-add design. With auto-display, empty cells (no thread color selected yet) are visually obvious without a separate warning.

## Risks / Trade-offs

- **Large grid for styles with many colors**: If a style has 20+ colors × 5+ specs, the grid could be long → Mitigation: already sorted alphabetically, each group is collapsible (existing `q-expansion-item` pattern). Acceptable tradeoff.
- **Removing addedColors breaks any in-progress manual workflows**: Users who manually added colors but haven't saved yet lose that state → Mitigation: minimal risk since the new behavior shows all colors anyway (superset of manual additions).
- **thread_type_id resolution depends on supplier color catalog structure**: If a color exists in multiple thread types for the same supplier, resolution could be ambiguous → Mitigation: The current data model links colors to specific thread_types via `thread_type_colors`. The spec's `thread_type_id` already constrains which thread types are relevant — use it as the default, only override when user explicitly picks a different thread color.
