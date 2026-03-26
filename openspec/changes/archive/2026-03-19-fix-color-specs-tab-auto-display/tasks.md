## 1. Refactor colorGroups to auto-display all colors

- [x] 1.1 Replace `usedColorIds` computed with direct iteration over `props.styleColors.filter(c => c.is_active)` in `colorGroups` computed
- [x] 1.2 Remove `addedColors` ref and all references to it (no longer needed)
- [x] 1.3 Remove `unmappedColors` computed and its warning banner in template ← (verify: no warning banner rendered, all active colors appear in grid)

## 2. Simplify color-adding UI

- [x] 2.1 Remove "Thêm màu hàng" dialog (`showAddColorDialog`, `selectedNewColorId`, `availableColorOptions`, related template)
- [x] 2.2 Keep "Tạo màu hàng mới" button and its form (creates new `style_color` record via `styleColorService`)
- [x] 2.3 Update header/toolbar: remove "Thêm" button, keep "Tạo màu hàng mới" button ← (verify: only "Tạo màu hàng mới" action available, dialog for adding existing colors is gone)

## 3. Fix thread_type_id persistence

- [x] 3.1 In `handleColorSpecEdit`, when creating a new color spec (POST), include `thread_type_id` from the parent spec (`row.spec.thread_type_id`)
- [x] 3.2 In `handleColorSpecEdit`, when updating an existing color spec (PUT), include `thread_type_id` from the parent spec
- [x] 3.3 When clearing thread color (set to null), send PUT with `thread_color_id: null` but keep `thread_type_id` ← (verify: DB records have non-null thread_type_id after save, calculation engine no longer warns about missing specs)

## 4. Cleanup and verify

- [x] 4.1 Run `npm run type-check` — no TypeScript errors
- [x] 4.2 Run `npm run lint` — no ESLint errors
- [ ] 4.3 Manual verification: open a style with multiple sub-arts, confirm all active colors auto-display in "Định Mức Màu" tab without manual adding ← (verify: all spec scenarios pass — 9 colors × 2 specs grid, no warning banner, thread_type_id persisted)
