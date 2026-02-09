## 1. Backend API

- [x] 1.1 In `server/routes/styles.ts`, add `GET /:id/spec-colors` endpoint that queries `style_color_thread_specs` → `style_thread_specs` → `colors` with DISTINCT on `color_id`, filtered by `style_id`
- [x] 1.2 Return `{ data: Array<{ id, name, hex_code }>, error: null }` format, with 400 for invalid ID

## 2. Frontend Service

- [x] 2.1 In `src/services/styleService.ts`, add `getSpecColors(styleId: number)` method that calls `GET /api/styles/:id/spec-colors`

## 3. Component Integration

- [x] 3.1 In `POOrderCard.vue`, add a `specColorsCache` ref (`Map<number, Array<{ id, name, hex_code }>>`) to cache fetched spec-colors per style_id
- [x] 3.2 Add a `fetchSpecColors(styleId)` async function that calls `styleService.getSpecColors()` and stores result in cache
- [x] 3.3 Add a `watch` on `poEntries` to fetch spec-colors for any style_id not yet in cache
- [x] 3.4 Replace `getColorOptionsForStyle` to read from `specColorsCache` instead of SKU data

## 4. Verify

- [x] 4.1 Run `npm run type-check` to ensure no TypeScript errors
- [x] 4.2 Run `npm run lint` to ensure code style compliance
