## Why

The weekly thread order page (`/thread/weekly-order`) color dropdown currently derives its options from SKU records (`skus` table via `po_items`). This shows ALL colors that exist in the PO regardless of whether thread specs have been configured for them. Colors without thread specs cannot be used for thread calculation, making them noise in the dropdown. The correct source is `style_color_thread_specs` — only colors that have pre-configured thread specifications should appear as options.

## What Changes

- Add a new backend endpoint `GET /api/styles/:id/spec-colors` that returns unique colors from `style_color_thread_specs` for a given style
- Add a frontend service method `styleService.getSpecColors(styleId)` to call this endpoint
- Replace the color options source in `POOrderCard.vue` from SKU-derived colors to API-fetched spec colors, with local caching per style

## Capabilities

### New Capabilities

- `style-spec-colors-api`: Backend endpoint returning deduplicated colors that have thread specifications configured for a style

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Backend**: `server/routes/styles.ts` — new GET endpoint
- **Frontend service**: `src/services/styleService.ts` — new method
- **Frontend component**: `src/components/thread/weekly-order/POOrderCard.vue` — replace sync `getColorOptionsForStyle` with async API-based approach using reactive cache
- **No database changes** — reads existing `style_color_thread_specs` + `style_thread_specs` + `colors` tables
