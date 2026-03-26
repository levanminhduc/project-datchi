## Why

The weekly order detail page (`thread/weekly-order/[id]`) has two issues: (1) the "Trạng thái xuất chỉ" section displays "-" for color names because the frontend reads `item.color?.name` while the backend returns `item.style_color.color_name`, and (2) the "Trả dư" surplus preview dialog only shows a total cone count without any breakdown by thread type or own-vs-borrowed distinction, making it hard for users to understand what will happen when they confirm.

## What Changes

- **Fix color display bug**: Change frontend template references from `item.color?.name` / `item.color?.hex_code` to `item.style_color?.color_name` / `item.style_color?.hex_code` in the completion checklist section.
- **Enhance surplus preview endpoint**: Modify `GET /api/weekly-orders/:id/surplus-preview` to return a per-thread-type breakdown showing own cones, borrowed cones, and where borrowed cones will go (re-reserve to original week or release to AVAILABLE).
- **Enhance surplus preview dialog**: Update the dialog UI to display a table with NCC, Tex, Màu, own cone count, and borrowed cone count per thread type, plus a summary of borrowed cone destinations.

## Capabilities

### New Capabilities

- `surplus-preview-breakdown`: Per-thread-type breakdown in surplus preview endpoint and dialog, distinguishing own cones from borrowed cones with destination info.

### Modified Capabilities

- `week-completion`: Fix color display bug in the issuance completion checklist — `item.color?.name` → `item.style_color?.color_name`.

## Impact

- **Backend**: `server/routes/weeklyOrder.ts` — `GET /:id/surplus-preview` endpoint enhanced query
- **Frontend**: `src/pages/thread/weekly-order/[id].vue` — completion checklist color fix + surplus dialog breakdown table
- **Types**: `src/types/thread/weeklyOrder.ts` — `SurplusPreview` interface extended with `breakdown` array
- **No database changes**: All data already exists in `thread_inventory` + `thread_types` + `suppliers` + `colors`
- **No breaking changes**: Existing `SurplusPreview` fields preserved, `breakdown` is additive
