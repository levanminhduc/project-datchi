## Why

The weekly thread order page (`/thread/weekly-order`) has two bugs related to color handling when selecting styles (mã hàng) from PO items:

1. **Auto-add colors**: When a user selects a style, ALL SKU colors are automatically added to the order entry. The user wants to manually add colors one by one via the existing "Thêm màu" dropdown.
2. **Duplicate/phantom colors**: Colors from SKUs appear duplicated (e.g., 4x per color) because the `skus` table contains one row per `(color_id, size)` combination, and the code does not deduplicate by `color_id`. Additionally, phantom white entries may appear from empty/default color records.

## What Changes

- Remove auto-add of SKU colors when adding a style to the weekly order. Only the style entry is created; colors are added manually by the user.
- Deduplicate color options derived from SKUs so each unique color appears only once in the dropdown, regardless of how many size variants exist.
- Clean up related emit signatures and handler parameters that pass `skuColors` (no longer needed for auto-add).

## Capabilities

### New Capabilities

- `weekly-order-color-fix`: Fix color selection behavior in the weekly order page — remove auto-add, deduplicate SKU-derived color options.

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Frontend only** — no backend or database changes required.
- Files affected:
  - `src/pages/thread/weekly-order/index.vue` — remove auto-add loop in `handleAddStyleFromPO`
  - `src/components/thread/weekly-order/POOrderCard.vue` — deduplicate colors in `getColorOptionsForStyle`, simplify emit for `add-style`
  - `src/components/thread/weekly-order/StyleOrderCard.vue` — no changes needed (already supports manual color add)
