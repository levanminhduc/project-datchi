## 1. Remove auto-add colors

- [x] 1.1 In `src/pages/thread/weekly-order/index.vue`, remove the `skuColors` parameter from `handleAddStyleFromPO` and delete the `for...addColorToStyle` loop (lines 377-397)
- [x] 1.2 In `src/components/thread/weekly-order/POOrderCard.vue`, update `add-style` emit type to remove the `skuColors` array parameter
- [x] 1.3 In `POOrderCard.vue`, update `handleAddStyle` to emit without `getSkuColors()` second argument
- [x] 1.4 In `POOrderCard.vue`, update `handleAddAllStyles` to emit without `getSkuColors()` second argument
- [x] 1.5 Remove the `getSkuColors` helper function from `POOrderCard.vue` (no longer used)

## 2. Deduplicate color options

- [x] 2.1 In `POOrderCard.vue`, refactor `getColorOptionsForStyle` to deduplicate colors by `color_id` using a Map, so each unique color appears exactly once regardless of size variants

## 3. Verify

- [x] 3.1 Run `npm run type-check` to ensure no TypeScript errors
- [x] 3.2 Run `npm run lint` to ensure code style compliance
