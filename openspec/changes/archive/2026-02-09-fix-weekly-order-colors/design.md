## Context

The weekly thread order page follows a flow: Select PO → Select Style (mã hàng) → Select Colors (màu hàng) → Enter quantities. Currently, when a style is added from a PO, all SKU colors are automatically added. Additionally, the color options derived from SKUs contain duplicates because the `skus` table stores one row per `(color_id, size)` combination — a style with 4 sizes produces 4 identical color entries.

### Current code flow

```
POOrderCard.handleAddStyle()
  → emit('add-style', styleData, skuColors)      // sends ALL sku colors
    → index.vue.handleAddStyleFromPO(style, skuColors)
      → addStyle(style)                           // creates entry with empty colors[]
      → for (color of skuColors) {                // auto-adds ALL colors
          addColorToStyle(style.id, color, po_id)
        }

POOrderCard.getColorOptionsForStyle(styleId)
  → poItem.skus.filter(sku => sku.color)          // no dedup
    .map(sku => ({ id, name, hex_code }))          // 4 sizes = 4 identical entries
```

## Goals / Non-Goals

**Goals:**
- Remove automatic color addition when selecting a style — user adds colors manually
- Deduplicate color options from SKUs so each color appears exactly once
- Clean up unused `skuColors` parameter passing through emit chain

**Non-Goals:**
- Changing the data model (skus table structure stays as-is)
- Modifying backend API responses
- Changing how `handleAddAllStyles` works beyond removing auto-color-add
- Adding the ability to select colors from the full `colors` table (only SKU colors)

## Decisions

### Decision 1: Remove auto-add loop, keep emit structure minimal

Remove the `for...addColorToStyle` loop in `handleAddStyleFromPO`. Simplify the `add-style` emit to not include `skuColors` since it's no longer consumed.

**Alternative considered**: Keep passing `skuColors` but don't auto-add — rejected because it's dead data that adds confusion.

### Decision 2: Deduplicate using Map keyed by color_id

In `getColorOptionsForStyle`, use a `Map<number, ColorOption>` to collect unique colors by `color_id`. This is O(n) and handles any number of size variants.

**Alternative considered**: Using `Array.filter` with `findIndex` — works but less efficient and less readable.

### Decision 3: No filter for "phantom white" colors

The phantom white entries are likely caused by the deduplication bug (same color appearing multiple times makes it seem like extras). After dedup fix, if phantom whites persist, it's a data issue in the `skus` table that should be fixed at the data level, not with frontend filtering hacks.

## Risks / Trade-offs

- **[Behavior change]** Users who relied on auto-add will now need to manually add each color → This is the requested behavior. The "Thêm màu" dropdown + button already exists and works.
- **[handleAddAllStyles also affected]** The "Thêm tất cả" button in POOrderCard also passes skuColors → Must update this handler too to not auto-add colors.
