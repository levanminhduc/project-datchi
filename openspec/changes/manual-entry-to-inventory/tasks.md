## 1. Backend — Rewrite POST /api/stock handler

- [x] 1.1 In `server/routes/stock.ts`, rewrite the `POST /` handler: remove `thread_stock` upsert logic; add lookup for `thread_types.meters_per_cone` by `thread_type_id`; fetch `partial_cone_ratio` via `fn_get_partial_cone_ratio()` RPC call; validate warehouse exists
- [x] 1.2 Implement lot auto-creation: generate `MC-LOT-{YYYYMMDD}-{HHmmss}` (or use user-provided lot_number); insert into `lots` table with status `ACTIVE`, total_cones, available_cones, thread_type_id, warehouse_id, expiry_date, notes
- [x] 1.3 Implement cone record generation loop: create N full cones (`is_partial: false`, `quantity_meters: meters_per_cone`) + M partial cones (`is_partial: true`, `quantity_meters: meters_per_cone * partial_cone_ratio`); each with auto-generated `cone_id: MC-{timestamp}-{NNNN}`, `status: 'AVAILABLE'`, `received_date`, `expiry_date`, `lot_number`
- [x] 1.4 Insert all cone records into `thread_inventory` via single batch insert; return response `{ data: { cones_created, lot_number, cone_ids }, error: null, message }` using project standard format (not legacy `success` field) ← (verify: all spec scenarios pass — full only, partial only, mixed; response format matches project convention `{ data, error, message }`; FEFO index picks up new cones with status AVAILABLE)

## 2. Manual Testing

- [ ] 2.1 Test manual stock entry via the inventory page dialog: enter qty_full_cones and qty_partial_cones, verify cone records appear in thread_inventory with correct status, lot_number, and quantity_meters
- [ ] 2.2 Verify FEFO visibility: after manual entry, check that cones appear in allocation queries (status = AVAILABLE, correct FEFO ordering by is_partial DESC, expiry_date ASC, received_date ASC)
