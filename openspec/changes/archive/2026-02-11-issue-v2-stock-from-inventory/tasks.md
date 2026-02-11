## 1. Backend - Modify getStockAvailability

- [x] 1.1 In `server/routes/issuesV2.ts`, locate `getStockAvailability()` function (around line 105)
- [x] 1.2 Replace query from `thread_stock` to `thread_inventory`
- [x] 1.3 Add filter `status = 'AVAILABLE'`
- [x] 1.4 Count full cones: rows where `is_partial = false`
- [x] 1.5 Count partial cones: rows where `is_partial = true`
- [x] 1.6 Keep optional `warehouseId` filter logic

## 2. Testing

- [ ] 2.1 Restart server
- [ ] 2.2 Test `/api/issues/v2/form-data` returns non-zero stock values
- [ ] 2.3 Verify stock values match Weekly Order page
- [ ] 2.4 Test with thread type that has no available cones (should return 0)
