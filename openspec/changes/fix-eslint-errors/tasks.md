## 1. Backend route fixes

- [ ] 1.1 `server/routes/batch.ts`: Remove unused import `MAX_BATCH_SIZE`, prefix unused destructured var `remainingCones` with `_`
- [ ] 1.2 `server/routes/issuesV2.ts`: Remove or prefix unused parameter `issueLineId` in `deductStock` function
- [ ] 1.3 `server/routes/notifications.ts`: Replace `const { data, error }` with `const { error }` (data is unused, response returns `{ id }`)
- [ ] 1.4 `server/routes/recovery.ts`: Remove unused function `generateMovementCode`
- [ ] 1.5 `server/routes/reports.ts`: Remove unused interface `ReportFilters`; fix multiline function call at line 106
- [ ] 1.6 `server/routes/warehouses.ts`: Remove unused import `WarehouseType`; replace empty-extends interfaces with type aliases (`type Warehouse = WarehouseRow`, `type WarehouseTree = WarehouseTreeNode`)

## 2. Frontend component fixes

- [ ] 2.1 `src/components/hardware/BarcodeScanField.vue`: Remove unused import `onMounted`
- [ ] 2.2 `src/components/hardware/ScaleConnectionDialog.vue`: Remove unused import `ref`
- [ ] 2.3 `src/components/offline/ConflictDialog.vue`: Prefix unused catch variable `err` with `_`
- [ ] 2.4 `src/components/offline/OfflineSyncBanner.vue`: Remove unused import `computed`
- [ ] 2.5 `src/components/thread/AllocationFormDialog.vue`: Remove unused imports `ThreadType`, `AllocationStatus`, `AppButton`, `WeightMeterDisplay`
- [ ] 2.6 `src/components/thread/ColorSelector.vue`: Add `<div />` placeholder in empty template

## 3. Verification

- [ ] 3.1 Run `npm run lint` — zero errors ← (verify: all 17 original errors are gone, no new errors introduced)
- [ ] 3.2 Run `npm run type-check` — passes clean ← (verify: no type regressions from removed imports/vars)
