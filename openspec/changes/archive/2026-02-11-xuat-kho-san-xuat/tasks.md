## 1. Database Schema

- [x] 1.1 Create migration for thread_issue_requests table with columns: id, issue_code, po_id, style_id, color_id, thread_type_id, department, quota_meters, requested_meters, issued_meters, status, notes, created_by, created_at, updated_at
- [x] 1.2 Create migration for thread_issue_items table with columns: id, issue_request_id, cone_id, allocation_id, quantity_meters, batch_number, over_limit_notes, issued_by, issued_at
- [x] 1.3 Create migration for thread_issue_returns table with columns: id, issue_item_id, cone_id, original_meters, remaining_percentage, calculated_remaining_meters, notes, returned_by, returned_at
- [x] 1.4 Create v_issue_reconciliation view joining requests, items, returns with calculated fields
- [x] 1.5 Add indexes for performance: (po_id, style_id, color_id, thread_type_id), (issue_request_id), (cone_id)
- [x] 1.6 Add issue_request_status enum: PENDING, PARTIAL, COMPLETED, CANCELLED

## 2. Database Functions

- [x] 2.1 Create fn_generate_issue_code() function for auto-generating XK-YYYYMMDD-NNN format
- [x] 2.2 Create fn_calculate_quota() function to calculate quota from style_thread_specs
- [x] 2.3 Create fn_check_quota() function to check remaining quota for PO/Style/Color/ThreadType
- [x] 2.4 Create trigger to update issued_meters on thread_issue_requests when items are added/removed
- [x] 2.5 Create trigger to update thread_issue_requests status based on issued_meters

## 3. Backend API - Issue Requests

- [x] 3.1 Create Zod schemas for issue request validation (create, update, list filters)
- [x] 3.2 Implement POST /api/issues - create issue request with quota calculation
- [x] 3.3 Implement GET /api/issues - list issue requests with pagination and filters
- [x] 3.4 Implement GET /api/issues/:id - get issue request detail with items
- [x] 3.5 Implement PATCH /api/issues/:id - update issue request (notes, cancel)
- [x] 3.6 Implement GET /api/issues/quota/:poId/:styleId/:colorId/:threadTypeId - check quota

## 4. Backend API - Issue Items

- [x] 4.1 Create Zod schemas for issue items validation
- [x] 4.2 Implement POST /api/issues/:id/items - add cone to issue request with over-limit check
- [x] 4.3 Implement DELETE /api/issues/:id/items/:itemId - remove cone from request
- [x] 4.4 Update thread_inventory status to IN_PRODUCTION on issue
- [x] 4.5 Create thread_movements record on issue

## 5. Backend API - Returns

- [x] 5.1 Create Zod schemas for returns validation (percentage required)
- [x] 5.2 Implement POST /api/issues/returns - return partial cone with percentage
- [x] 5.3 Implement GET /api/issues/returns - list returns with filters
- [x] 5.4 Update thread_inventory on return: quantity_meters, is_partial, status
- [x] 5.5 Create thread_movements record on return

## 6. Backend API - Reconciliation

- [x] 6.1 Implement GET /api/issues/reconciliation - get reconciliation data with filters
- [x] 6.2 Implement GET /api/issues/reconciliation/export - export to Excel
- [x] 6.3 Create endpoint for over-limit summary

## 7. Backend API - Department

- [x] 7.1 Implement GET /api/employees/departments - get DISTINCT departments from employees table

## 8. Frontend Services

- [x] 8.1 Create issueService.ts with CRUD operations for issue requests
- [x] 8.2 Create issueItemService.ts for adding/removing cones
- [x] 8.3 Create issueReturnService.ts for return operations
- [x] 8.4 Create reconciliationService.ts for reconciliation data
- [x] 8.5 Add getDepartments() to employeeService.ts

## 9. Frontend Types

- [x] 9.1 Create types/issue.ts with IssueRequest, IssueItem, IssueReturn interfaces
- [x] 9.2 Create types/reconciliation.ts with ReconciliationData interface
- [x] 9.3 Add IssueRequestStatus enum

## 10. Frontend Composables

- [x] 10.1 Create useIssueRequest composable for state management
- [x] 10.2 Create useIssueItems composable for cone management
- [x] 10.3 Create useIssueReturns composable for return processing
- [x] 10.4 Create useReconciliation composable for reporting

## 11. Frontend Components

- [x] 11.1 Create IssueRequestForm.vue - form with PO/Style/Color/ThreadType/Department selectors
- [x] 11.2 Create IssueItemList.vue - list of cones in issue request
- [x] 11.3 Create QuotaWarning.vue - warning component for over-limit situations
- [x] 11.4 Create PercentageSelector.vue - 10% increment buttons for return percentage
- [x] 11.5 Create ReturnForm.vue - return form with percentage selection
- [x] 11.6 Create ReconciliationTable.vue - reconciliation data table

## 12. Frontend Pages - Desktop

- [x] 12.1 Create pages/thread/issues/index.vue - issue request list page
- [x] 12.2 Create pages/thread/issues/new.vue - create new issue request
- [x] 12.3 Create pages/thread/issues/[id].vue - issue request detail with cone management
- [x] 12.4 Create pages/thread/issues/reconciliation.vue - reconciliation report page
- [x] 12.5 Add navigation links to thread menu

## 13. Frontend Pages - Mobile

- [x] 13.1 Create pages/thread/mobile/issue-scan.vue - barcode scanning for cone issuance
- [x] 13.2 Create pages/thread/mobile/return.vue - return processing with percentage selection
- [x] 13.3 Add mobile navigation links

## 14. Integration

- [ ] 14.1 Update allocation service to support linking to issue items
- [ ] 14.2 Add issue request link in allocation detail view
- [ ] 14.3 Enable realtime subscription for thread_issue_requests table

## 15. Testing & Validation

- [ ] 15.1 Test quota calculation with various BOM configurations
- [ ] 15.2 Test over-limit flow with mandatory notes
- [ ] 15.3 Test return flow with percentage calculation
- [ ] 15.4 Test reconciliation accuracy
- [x] 15.5 Run type-check and lint
