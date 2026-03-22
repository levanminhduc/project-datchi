## Why

The "Định Mức Màu" (Color Thread Specs) tab in the Style detail page (`thread/styles/[id]`) requires users to manually add each style color before they can assign thread colors. This is wrong — once specs exist in "Định Mức Chỉ" tab, ALL active style_colors should auto-display in the color specs grid. Currently only 4 out of 9 colors show (those with existing DB records), and the remaining 5 trigger warnings during weekly order calculation ("chưa có định mức chỉ chi tiết, dùng loại chỉ mặc định").

Additionally, when users select a thread color, the frontend only saves `thread_color_id` but never sends `thread_type_id`, causing all color specs to have `thread_type_id = null` in the DB — making the calculation engine fall back to TEX-level defaults even for colors that have been configured.

## What Changes

- **Auto-display all colors**: `colorGroups` computed builds from ALL active `props.styleColors` instead of only `usedColorIds` (DB records + manually added). Every active style color automatically appears as a row group.
- **Remove "Thêm màu hàng" workflow**: The manual color-adding dialog and `addedColors` state become unnecessary. Replace with "Tạo màu hàng mới" (creates a new style_color in the system, not just adds to view).
- **Fix thread_type_id persistence**: When user selects a thread color, auto-resolve and send `thread_type_id` from the supplier's thread catalog so the DB record has proper type info for calculation.
- **Clean up unmappedColors warning**: Since all colors auto-display, the `unmappedColors` computed and its warning banner are no longer needed for missing-record detection.

## Capabilities

### New Capabilities
- `auto-display-color-specs`: All active style_colors automatically appear in the color specs grid when specs exist, without manual addition.

### Modified Capabilities
(none — no existing spec-level requirements are changing)

## Impact

- **Frontend**: `src/components/thread/StyleColorSpecsTab.vue` — primary changes (colorGroups, unmappedColors, dialog, handleColorSpecEdit)
- **Backend**: `server/routes/styleThreadSpecs.ts` — minor: ensure POST/PUT color-specs properly handles `thread_type_id` (already supported, just frontend not sending it)
- **No DB migration needed** — existing schema supports `thread_type_id` on `style_color_thread_specs`
- **No breaking changes** — existing color spec records remain valid, new behavior is additive
