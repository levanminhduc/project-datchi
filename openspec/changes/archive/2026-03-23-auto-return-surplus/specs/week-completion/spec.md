## ADDED Requirements

### Requirement: Mark PO-Style-Color item as issuance complete
The system SHALL allow users to mark individual `thread_order_items` as "issuance complete" when the weekly order status is `CONFIRMED`. Each completion record stores `item_id`, `completed_at`, and `completed_by`.

#### Scenario: Mark item as complete
- **WHEN** user clicks the completion checkbox for a PO-Style-Color item on the Weekly Order detail page AND the week status is `CONFIRMED`
- **THEN** system creates a `thread_order_item_completions` record with the item ID, current timestamp, and authenticated user's name

#### Scenario: Undo item completion
- **WHEN** user unchecks the completion checkbox for a previously completed item AND the week status is still `CONFIRMED` (not yet COMPLETED)
- **THEN** system deletes the corresponding `thread_order_item_completions` record

#### Scenario: Cannot mark item on non-CONFIRMED week
- **WHEN** user attempts to mark an item as complete on a week with status `DRAFT`, `CANCELLED`, or `COMPLETED`
- **THEN** system rejects the request with an error message

### Requirement: Trả dư button availability
The system SHALL display a "Trả dư" (Return Surplus) button on the Weekly Order detail page that is enabled only when ALL items in the week have been marked as complete.

#### Scenario: Button disabled when incomplete items exist
- **WHEN** user views a CONFIRMED week where 2 of 3 items are marked complete
- **THEN** the "Trả dư" button is visible but disabled, showing "2/3 hoàn tất"

#### Scenario: Button enabled when all items complete
- **WHEN** user views a CONFIRMED week where all items are marked complete
- **THEN** the "Trả dư" button is enabled and clickable

#### Scenario: Button not shown on non-CONFIRMED weeks
- **WHEN** user views a week with status DRAFT, CANCELLED, or COMPLETED
- **THEN** the "Trả dư" button is not displayed

### Requirement: Preview dialog before release
The system SHALL show a confirmation dialog before executing the surplus release, displaying the count of cones that will be returned to available stock.

#### Scenario: Preview shows cone count
- **WHEN** user clicks the "Trả dư" button
- **THEN** system displays a dialog showing "Sẽ trả X cuộn về Khả dụng. Bạn chắc chắn?" where X is the count of `RESERVED_FOR_ORDER` cones for this week

#### Scenario: Preview shows zero cones
- **WHEN** user clicks "Trả dư" and no `RESERVED_FOR_ORDER` cones remain for this week
- **THEN** dialog shows "Không còn cuộn nào cần trả. Tuần sẽ được đánh dấu hoàn tất." and user can still confirm to lock the week

### Requirement: Week status transitions to COMPLETED
The system SHALL add `COMPLETED` as a valid status for `thread_order_weeks`. The transition `CONFIRMED → COMPLETED` is allowed only via the "Trả dư" flow. `COMPLETED` is a terminal state with no further transitions.

#### Scenario: Successful completion
- **WHEN** user confirms the "Trả dư" dialog AND all items are marked complete
- **THEN** week status changes to `COMPLETED` and no further status changes are possible

#### Scenario: Completed week is read-only
- **WHEN** a week has status `COMPLETED`
- **THEN** no modifications are allowed: no new items, no editing items, no loans, no reservations, no status changes

### Requirement: Block Issue V2 for completed PO-Style-Color combos
The system SHALL prevent new Issue V2 lines from being created or confirmed for PO-Style-Color combinations where ALL associated weekly orders have status `COMPLETED`.

#### Scenario: Block new issuance for fully completed combo
- **WHEN** user attempts to validate or confirm an Issue V2 line for PO-001/Style-A/Color-Red AND every weekly order containing PO-001/Style-A/Color-Red has status `COMPLETED`
- **THEN** system returns an error: "PO-Style-Màu này đã hoàn tất xuất trong tất cả tuần đặt hàng"

#### Scenario: Allow issuance when some weeks still CONFIRMED
- **WHEN** user creates an Issue V2 line for PO-001/Style-A/Color-Red AND Week 1 is `COMPLETED` but Week 2 is `CONFIRMED` for the same combo
- **THEN** system allows the issuance (quota calculated from Week 2 only)

#### Scenario: Over-quota bypass blocked for completed combos
- **WHEN** user provides over_quota_notes for a combo where all weeks are COMPLETED
- **THEN** system still blocks with the same error (hard block, not overridable)
