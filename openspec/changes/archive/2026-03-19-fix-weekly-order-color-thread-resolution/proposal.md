## Why

Weekly order calculation (`aggregateResults`) groups results by `thread_type_id`. The `style_thread_specs.thread_type_id` (originally `tex_id`) stores a TEX-level thread type (e.g., "Tex 20" without color), while `style_color_thread_specs.thread_type_id` stores the full thread type (NCC + Tex + Color). When `style_color_thread_specs` entries are missing for a garment color, `buildCalculation()` falls back to the TEX-level base type, causing all colors to merge into one row. This makes weekly order "Tổng hợp" inconsistent with inventory "Tổng hợp theo cuộn" which correctly separates by colored thread cone.

## What Changes

- Enforce that every `style_thread_spec` + garment color combination has a corresponding `style_color_thread_specs` entry pointing to a color-specific `thread_type_id`
- Add backend validation on weekly order calculation to warn when color specs are missing
- Update style thread spec management UI to require color-level thread type assignment for all style colors
- Backfill existing `style_color_thread_specs` gaps using the parent spec's `thread_type_id` as default

## Capabilities

### New Capabilities

- `color-thread-spec-enforcement`: Validation and UI enforcement ensuring every style_thread_spec has complete color-level thread type mappings via style_color_thread_specs

### Modified Capabilities

- `weekly-order-inventory-columns`: Add warning display when calculation results contain unresolved (TEX-level) thread types

## Impact

- **Backend**: `server/routes/threadCalculation.ts` (buildCalculation warning), style spec CRUD routes (validation)
- **Frontend**: Style thread spec management UI (enforce color mapping), weekly order results table (warning indicators)
- **Database**: Backfill migration for existing `style_color_thread_specs` gaps
- **No breaking changes**: Existing API contracts unchanged, only stricter validation added
