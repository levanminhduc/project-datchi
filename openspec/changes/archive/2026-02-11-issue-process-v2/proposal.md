## Why

The current thread issue process tracks individual cones with unique IDs (cone_id), creating thousands of database records. However, since threads don't have QR codes/barcodes, this granular tracking provides no practical value while adding complexity. Additionally, the current system only allows issuing one thread color per request, requiring multiple requests when a single product color needs multiple thread colors (per BOM).

The goal is to simplify inventory tracking to quantity-based (full cones + partial cones), enable multi-thread-color issues per request, and control quota by number of cones rather than meters.

## What Changes

- **New inventory model**: Replace per-cone tracking (`thread_inventory`) with quantity-based tracking (`thread_stock`) grouped by thread type and optional lot number
- **New issue flow**: One issue request can contain multiple lines (one line per thread color), allowing all threads for a product color to be issued together
- **Quantity-based input**: Users enter number of full cones + partial cones instead of scanning barcodes
- **Cone-based quota**: Quota calculated from Weekly Order in cones (meters ÷ meters_per_cone), with user-adjustable values
- **Partial cone ratio**: Configurable ratio (default 0.3) for converting partial cones to equivalent full cones
- **System settings table**: New table for configurable parameters like partial_cone_ratio
- **Data migration**: Existing `thread_inventory` records consolidated into `thread_stock` summary records
- **Return flow**: Returns recorded as full cones + partial cones returned

## Capabilities

### New Capabilities

- `thread-stock`: Quantity-based inventory management with lot tracking (replaces cone-based tracking)
- `thread-issue-v2`: Multi-line thread issue process with quantity input and cone-based quota control
- `thread-return-v2`: Return process using quantity (full + partial cones) instead of scanning
- `system-settings`: Configurable system parameters stored in database

### Modified Capabilities

- `weekly-order`: Add quota_cones field to order items, display cone quota in calculation results
- `delivery-receiving`: Update to create stock records instead of individual cone records

## Impact

### Database
- New tables: `system_settings`, `thread_stock`, `thread_issues`, `thread_issue_lines`
- Modified tables: `thread_order_items` (add quota_cones column)
- Migration: Consolidate `thread_inventory` → `thread_stock`
- Deprecate: `thread_issue_requests`, `thread_issue_items`, `thread_issue_returns` (replaced by new structure)

### Backend (Hono)
- New routes: `/api/settings`, `/api/stock`, `/api/issues/v2`
- Modified routes: `/api/weekly-orders/deliveries/:id/receive`

### Frontend (Vue)
- New pages: Settings page, Issue V2 page, Return V2 page
- Modified pages: Weekly Order (show quota cones), Deliveries (use stock instead of cones)
- Modified services: issueService, deliveryService, new stockService

### Business Logic
- Quota check: Compare issued cones vs quota cones (full + partial × ratio)
- Over-quota: Allow with mandatory notes
- FEFO: When issuing, prioritize older lots (if lot_number tracked)
