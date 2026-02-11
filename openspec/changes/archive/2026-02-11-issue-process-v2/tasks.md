## 1. Database Schema & Migration

- [x] 1.1 Create system_settings table with partial_cone_ratio default
- [x] 1.2 Create thread_stock table with qty_full_cones, qty_partial_cones columns
- [x] 1.3 Create v_stock_summary view (aggregated by thread_type_id)
- [x] 1.4 Create thread_issues table (header)
- [x] 1.5 Create thread_issue_lines table (details)
- [x] 1.6 Add quota_cones column to thread_order_items
- [x] 1.7 Create migration script to consolidate thread_inventory → thread_stock
- [x] 1.8 Create v_issue_reconciliation view for reporting

## 2. Backend - System Settings

- [x] 2.1 Create settings route file (server/routes/settings.ts)
- [x] 2.2 Implement GET /api/settings (list all)
- [x] 2.3 Implement GET /api/settings/:key (get single)
- [x] 2.4 Implement PUT /api/settings/:key (update)
- [x] 2.5 Create Zod validation schemas for settings
- [x] 2.6 Register settings routes in server/index.ts

## 3. Backend - Thread Stock

- [x] 3.1 Create stock route file (server/routes/stock.ts)
- [x] 3.2 Create stock types (src/types/thread/stock.ts)
- [x] 3.3 Implement GET /api/stock (with filters)
- [x] 3.4 Implement GET /api/stock/summary
- [x] 3.5 Implement POST /api/stock (add stock)
- [x] 3.6 Implement POST /api/stock/deduct (deduct with FEFO)
- [x] 3.7 Implement POST /api/stock/return (add back)
- [x] 3.8 Create Zod validation schemas for stock operations
- [x] 3.9 Create stockService.ts (frontend service)
- [x] 3.10 Register stock routes in server/index.ts

## 4. Backend - Thread Issue V2

- [x] 4.1 Create issues v2 route file (server/routes/issuesV2.ts)
- [x] 4.2 Create issue v2 types (src/types/thread/issueV2.ts)
- [x] 4.3 Implement auto-generate issue code (XK-YYYYMMDD-NNN)
- [x] 4.4 Implement POST /api/issues/v2 (create issue)
- [x] 4.5 Implement GET /api/issues/v2/form-data (load thread types with quota & stock for PO/Style/Color)
- [x] 4.6 Implement POST /api/issues/v2/:id/lines (add line with quota lookup)
- [x] 4.7 Implement POST /api/issues/v2/:id/lines/validate (validate line - compute equivalent, check quota/stock)
- [x] 4.8 Implement GET /api/issues/v2/:id (get with lines + computed fields: issued_equivalent, is_over_quota, stock)
- [x] 4.9 Implement GET /api/issues/v2 (list with filters)
- [x] 4.10 Implement POST /api/issues/v2/:id/confirm (confirm & deduct stock)
- [x] 4.11 Implement quota check with over_quota_notes validation (backend logic)
- [x] 4.12 Implement POST /api/issues/v2/:id/return (return & add stock)
- [x] 4.13 Implement issued_equivalent calculation helper (backend)
- [x] 4.14 Create Zod validation schemas for issue v2
- [x] 4.15 Create issueV2Service.ts (frontend service - API calls only)
- [x] 4.16 Register issues v2 routes in server/index.ts

## 5. Backend - Modify Existing

- [x] 5.1 Update weekly order calculation to compute quota_cones
- [x] 5.2 Add PUT endpoint to update quota_cones in thread_order_items
- [x] 5.3 Update delivery receiving to create thread_stock instead of thread_inventory
- [x] 5.4 Keep lot_number generation in delivery receiving

## 6. Frontend - Settings Page

- [x] 6.1 Create settings page (src/pages/settings.vue)
- [x] 6.2 Create useSettings composable
- [x] 6.3 Display partial_cone_ratio with editable input
- [x] 6.4 Add save button with success/error feedback
- [x] 6.5 Add route in router config

## 7. Frontend - Issue V2 Page (Display Only - No Logic)

- [x] 7.1 Create issue v2 page (src/pages/thread/issues/v2/index.vue)
- [x] 7.2 Create useIssueV2 composable (API calls only, no calculations)
- [x] 7.3 Display department/created_by form (create issue)
- [x] 7.4 Display PO → Style → Color cascading selectors
- [x] 7.5 Call API to load thread types and display returned data (quota, stock from backend)
- [x] 7.6 Display quota_cones from API response
- [x] 7.7 Display stock availability from API response (N nguyên + M lẻ)
- [x] 7.8 Display quantity input fields (issued_full, issued_partial)
- [x] 7.9 Call validate API on input change and display returned issued_equivalent
- [x] 7.10 Display over-quota warning based on is_over_quota from API
- [x] 7.11 Show over_quota_notes input when is_over_quota = true
- [x] 7.12 Call confirm API and display result
- [x] 7.13 Add route in router config

## 8. Frontend - Return V2 Page (Display Only - No Logic)

- [x] 8.1 Create return v2 page (src/pages/thread/issues/v2/return.vue)
- [x] 8.2 Create useReturnV2 composable (API calls only)
- [x] 8.3 Display list of confirmed issues from API
- [x] 8.4 Display issue lines with issued vs returned from API
- [x] 8.5 Display return quantity input fields
- [x] 8.6 Call return API and display result
- [x] 8.7 Add route in router config

## 9. Frontend - Weekly Order Updates

- [x] 9.1 Add quota_cones column to weekly order results display
- [x] 9.2 Make quota_cones editable
- [x] 9.3 Add tooltip explaining calculation
- [x] 9.4 Implement save quota_cones changes

## 10. Testing & Cleanup

- [x] 10.5 Run type-check and lint
- [x] 10.6 Update navigation menu with new pages
- [ ] 10.1 Test migration script on sample data
- [ ] 10.2 Verify stock deduction/return flow
- [ ] 10.3 Verify quota check with over-quota notes
- [ ] 10.4 Test delivery receiving creates stock (not cones)
