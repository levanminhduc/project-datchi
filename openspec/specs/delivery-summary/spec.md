## ADDED Requirements

### Requirement: Delivery Summary API Endpoint
The system SHALL provide a GET endpoint at `/api/weekly-orders/:weekId/delivery-summary` that returns aggregated delivery statistics for a specific week.

#### Scenario: Successful retrieval with data
- **WHEN** user requests delivery summary for a week with deliveries
- **THEN** system returns `{ data: DeliverySummary, error: null }` with:
  - `total_ordered`: sum of all `quantity_cones`
  - `total_delivered`: sum of `quantity_cones` where status is DELIVERED
  - `total_received`: sum of all `received_quantity`
  - `percent_received`: rounded percentage (received/ordered * 100), or 0 if no ordered
  - `by_supplier`: array of breakdown rows

#### Scenario: Week with no deliveries
- **WHEN** user requests delivery summary for a week with no delivery records
- **THEN** system returns `{ data: { total_ordered: 0, total_delivered: 0, total_received: 0, percent_received: 0, by_supplier: [] }, error: null }`

#### Scenario: Invalid week ID
- **WHEN** user requests delivery summary with non-numeric week ID
- **THEN** system returns `{ data: null, error: "weekId không hợp lệ" }` with status 400

#### Scenario: Unauthorized access
- **WHEN** user without `thread.allocations.view` permission requests delivery summary
- **THEN** system returns 403 Forbidden

### Requirement: Delivery Breakdown by Supplier-Thread
The delivery summary breakdown SHALL include one row per unique combination of supplier_id + thread_type_id + thread_color.

#### Scenario: Multiple deliveries aggregated
- **WHEN** a week has multiple delivery records for the same supplier + tex + color
- **THEN** the `by_supplier` array contains one row with summed values for ordered, delivered, received

#### Scenario: Breakdown row calculation
- **WHEN** calculating breakdown row values
- **THEN** each row includes:
  - `pending_delivery`: ordered minus delivered quantities for non-DELIVERED records
  - `pending_receive`: delivered minus received quantities for DELIVERED records

### Requirement: DeliverySummarySection Component
The system SHALL provide a Vue component `DeliverySummarySection.vue` that displays delivery statistics.

#### Scenario: Display KPI cards
- **WHEN** component receives summary data
- **THEN** component displays 3 cards showing: "Đặt NCC" (ordered), "NCC đã giao" (delivered), "Đã nhập kho" (received)

#### Scenario: Display progress bar
- **WHEN** component receives summary data with percent_received
- **THEN** component displays a progress bar showing the percentage with label

#### Scenario: Display breakdown table
- **WHEN** component receives summary data with by_supplier array
- **THEN** component displays a table with columns: NCC, Tex, Màu, Đặt, Đã giao, Đã nhập, Chờ giao, Chờ nhập

#### Scenario: Loading state
- **WHEN** loading prop is true
- **THEN** component displays a loading spinner instead of content

#### Scenario: Empty state
- **WHEN** summary data has total_ordered = 0
- **THEN** component displays "Chưa có dữ liệu giao hàng"

#### Scenario: Refresh action
- **WHEN** user clicks refresh button
- **THEN** component emits 'refresh' event

#### Scenario: Link to detail page
- **WHEN** user clicks "Xem chi tiết giao hàng" link
- **THEN** navigation occurs to `/thread/weekly-order/deliveries`

### Requirement: Integration with Weekly Order Detail Page
The Deliveries tab in `/thread/weekly-order/[id]` SHALL display the DeliverySummarySection component.

#### Scenario: Tab loads summary on activation
- **WHEN** user clicks on the Deliveries tab
- **THEN** page loads delivery summary data for the current week

#### Scenario: Manual refresh
- **WHEN** user clicks refresh in the Deliveries tab
- **THEN** page reloads delivery summary data from API
