## Why

The Issue V2 page (`/thread/issues/v2`) has two critical problems:
1. **Route ordering bug**: `/api/issues/v2/*` routes are registered AFTER `/api/issues/*`, causing Hono to match the wrong router and return "Không thể tải dữ liệu form" errors.
2. **Data source mismatch**: Currently loads PO/Style/Color from ALL purchase orders, but should only load from `thread_order_items` in confirmed weekly orders to ensure proper quota control.

## What Changes

- **Fix route registration order** in `server/index.ts` - move `/api/issues/v2` before `/api/issues`
- **New endpoint** `GET /api/issues/v2/order-options` to load PO/Style/Color cascading data from confirmed weekly orders
- **Update Issue V2 page** to use the new endpoint instead of loading from all purchase orders
- **Filter logic**: Only items with `po_id IS NOT NULL` from weeks with `status = 'confirmed'`

## Capabilities

### New Capabilities
- `issue-v2-order-options`: API endpoint and frontend integration to load PO/Style/Color options from confirmed weekly orders with cascading filters

### Modified Capabilities
<!-- No existing specs are being modified - this is a new capability and a bug fix -->

## Impact

- **Backend**:
  - `server/index.ts` - route registration order change
  - `server/routes/issuesV2.ts` - new endpoint
- **Frontend**:
  - `src/pages/thread/issues/v2/index.vue` - replace option loading logic
- **Data flow**: Issue V2 will now only allow issuing for PO/Style/Color combinations that exist in confirmed weekly orders
