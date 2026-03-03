## MODIFIED Requirements

### Requirement: Auto-create delivery records on save
When weekly order results are saved via `POST /api/weekly-orders/:id/results`, the backend SHALL automatically create or update delivery records in `thread_order_deliveries` for each aggregated row that has a valid `supplier_id` and `delivery_date`. The system SHALL use UPSERT on `(week_id, thread_type_id)` to avoid duplicates. The system SHALL also populate `quantity_cones` from `total_final` in the summary_data.

#### Scenario: First save creates delivery records with quantity_cones
- **WHEN** results are saved for week_id=1 with 3 aggregated rows each having valid supplier_id and total_final values
- **THEN** 3 records SHALL be created in `thread_order_deliveries` with status='pending'
- **AND** delivery_date SHALL match the computed dates from the aggregated data
- **AND** quantity_cones SHALL match the total_final value for each thread_type_id

#### Scenario: Re-save updates delivery records including quantity_cones
- **WHEN** results are re-saved for week_id=1 (recalculated with different quantities)
- **THEN** existing delivery records SHALL be updated (upsert on week_id + thread_type_id)
- **AND** manually edited delivery_date values SHALL be preserved (not overwritten)
- **AND** quantity_cones SHALL be updated to match the new total_final values

#### Scenario: Aggregated row without supplier
- **WHEN** an aggregated row has `supplier_id: null`
- **THEN** no delivery record SHALL be created for that row
