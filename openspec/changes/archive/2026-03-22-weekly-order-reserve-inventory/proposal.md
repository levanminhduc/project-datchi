## Why

Weekly Orders currently calculate thread requirements but don't reserve inventory. When multiple WOs compete for the same thread types, there's no visibility into which cones are allocated to which orders. This leads to overselling and production delays when threads are unexpectedly unavailable.

## What Changes

- Add new cone status `RESERVED_FOR_ORDER` to soft-reserve inventory for Weekly Orders
- Add `reserved_week_id` and `original_week_id` columns to `thread_inventory` for tracking
- Create `thread_order_loans` table to track borrowing between WOs
- Auto-reserve available cones when confirming a Weekly Order
- Auto-reserve newly received cones for WOs with shortages
- Auto-release reserved cones when cancelling a Weekly Order
- Allow manual borrowing of reserved cones between WOs
- Modify `fn_allocate_thread` to allocate from `RESERVED_FOR_ORDER` status
- Track when cones reserved for one WO are used by another (auto-record loan)

## Capabilities

### New Capabilities
- `weekly-order-reserve`: Auto-reserve inventory when confirming Weekly Order, track cone assignments to orders
- `thread-loan-management`: Manual and automatic tracking of thread borrowing between Weekly Orders

### Modified Capabilities
- `thread-allocation`: Allow allocation from `RESERVED_FOR_ORDER` status, clear reservation on allocate

## Impact

- **Database**: Add enum value, 2 columns to `thread_inventory`, new `thread_order_loans` table
- **Backend**: Modify `fn_allocate_thread`, Weekly Order confirm/cancel endpoints, receive delivery endpoint
- **Frontend**: Display reservation status on WO detail, add loan dialog UI
- **Existing flows**: `thread/purchase-orders` issue flow will use reserved cones transparently
