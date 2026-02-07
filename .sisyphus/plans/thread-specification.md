# Plan: Thread Specification Feature (Định Mức Chỉ)

## Overview
Implement Thread Specification management system for calculating thread allocations in production. Bộ phận Kỹ Thuật can define thread consumption specifications (Định Mức Chỉ) per Style, then use it to calculate thread requirements for Production Orders.

## Database Schema Tasks

- [x] **DB-1**: Create `purchase_orders` table
  - Fields: id, po_number, customer_id, order_date, delivery_date, status, priority, notes, created_at, updated_at
  - FK to customers table
  - Vietnamese comments

- [x] **DB-2**: Create `styles` table  
  - Fields: id, style_code, style_name, description, fabric_type, created_at, updated_at
  - Unique constraint on style_code
  - Vietnamese comments

- [x] **DB-3**: Create `po_items` table (junction PO ↔ Style)
  - Fields: id, po_id, style_id, quantity, notes, created_at
  - FK to purchase_orders and styles
  - Vietnamese comments

- [x] **DB-4**: Create `skus` table (Style + Color + Size details)
  - Fields: id, po_item_id, color_id, size, quantity, created_at
  - FK to po_items and colors
  - Vietnamese comments

- [x] **DB-5**: Create `style_thread_specs` table (template định mức)
  - Fields: id, style_id, process_name, supplier_id, tex_id, meters_per_unit, notes, created_at, updated_at
  - FK to styles, suppliers, thread_types
  - Vietnamese comments

- [x] **DB-6**: Create `style_color_thread_specs` table (chi tiết với màu chỉ)
  - Fields: id, style_thread_spec_id, color_id, thread_type_id, notes, created_at
  - FK to style_thread_specs, colors, thread_types
  - Vietnamese comments

## Backend API Tasks

- [x] **API-1**: Create `purchaseOrders` routes
  - CRUD endpoints: GET /api/purchase-orders, POST /api/purchase-orders, GET /api/purchase-orders/:id, PUT /api/purchase-orders/:id, DELETE /api/purchase-orders/:id
  - Response format: { data, error, message }
  - Vietnamese error messages

- [x] **API-2**: Create `styles` routes
  - CRUD endpoints for styles management
  - Include endpoint to get thread specs for a style
  - Response format: { data, error, message }
  - Vietnamese error messages

- [x] **API-3**: Create `styleThreadSpecs` routes
  - CRUD for template specs
  - Endpoint to duplicate template to color-specific specs
  - Response format: { data, error, message }
  - Vietnamese error messages

- [x] **API-4**: Create calculation endpoint
  - POST /api/thread-calculation/calculate
  - Input: PO ID or Style ID + quantity
  - Output: Calculated thread requirements by process
  - Vietnamese error messages

## Frontend Tasks

- [x] **UI-1**: Create styles list page
  - Path: /thread/styles/index.vue
  - Display styles in DataTable with search/filter
  - Actions: View details, Edit, Delete
  - Responsive design

- [x] **UI-2**: Create style detail page with tabs
  - Path: /thread/styles/[id].vue
  - Tabs: Thông tin chung, Định mức chỉ, Tính toán
  - Form for basic style info

- [x] **UI-3**: Create thread specs template tab
  - Component: StyleThreadSpecsTable
  - Add/Edit/Delete spec rows
  - Fields: Công đoạn, NCC, Tex, Định mức mét/SP

- [x] **UI-4**: Create color-specific specs tab
  - Component: StyleColorThreadSpecsTable
  - Cascade filter: NCC → Tex → Màu
  - Select specific thread_type for each spec

- [x] **UI-5**: Create calculation page
  - Path: /thread/calculation/index.vue
  - Select PO or Style + Quantity
  - Display calculation results table
  - Button to create allocations

- [x] **UI-6**: Create services
  - purchaseOrderService.ts
  - styleService.ts
  - styleThreadSpecService.ts
  - threadCalculationService.ts

- [x] **UI-7**: Create composables
  - usePurchaseOrders.ts
  - useStyles.ts
  - useStyleThreadSpecs.ts
  - useThreadCalculation.ts

- [x] **UI-8**: Create types
  - types/thread/purchaseOrder.ts
  - types/thread/style.ts
  - types/thread/styleThreadSpec.ts

## Integration Tasks

- [x] **INT-1**: Integrate with allocation system
  - Link calculation results to allocation creation
  - Pass thread_type_id and calculated meters
  - Use existing allocation workflow

## Testing & Verification

- [x] **TEST-1**: Database migrations run successfully
- [x] **TEST-2**: API endpoints return correct format
- [x] **TEST-3**: Frontend pages load without errors
- [x] **TEST-4**: Type checking passes
- [x] **TEST-5**: Build succeeds

## Constraints
- All user-facing messages in Vietnamese
- Use existing UI component library (AppButton, AppInput, DataTable, etc.)
- Follow existing patterns in codebase
- Responsive design (mobile-first)
- Integration with existing thread_types table
- No direct Supabase in frontend - use Hono API
