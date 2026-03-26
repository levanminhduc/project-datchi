## MODIFIED Requirements

### Requirement: Preview dialog before release
The system SHALL show a confirmation dialog before executing the surplus release, displaying a per-thread-type breakdown of cones that will be returned. If breakdown data is unavailable, the dialog SHALL fall back to displaying only the total cone count.

#### Scenario: Preview shows breakdown table
- **WHEN** user clicks the "Trả dư" button AND the preview response includes a `breakdown` array
- **THEN** system displays a dialog with a table showing per-thread-type rows (NCC, Tex, Màu, own cones, borrowed cones) and a confirmation prompt

#### Scenario: Preview falls back to total count
- **WHEN** user clicks the "Trả dư" button AND the preview response has no `breakdown` field
- **THEN** system displays the original simple dialog: "Sẽ trả X cuộn về Khả dụng. Bạn chắc chắn?"

#### Scenario: Preview shows zero cones
- **WHEN** user clicks "Trả dư" and no `RESERVED_FOR_ORDER` cones remain for this week
- **THEN** dialog shows "Không còn cuộn nào cần trả. Tuần sẽ được đánh dấu hoàn tất." and user can still confirm to lock the week

### Requirement: Mark PO-Style-Color item as issuance complete
The system SHALL allow users to mark individual `thread_order_items` as "issuance complete" when the weekly order status is `CONFIRMED`. Each completion record stores `item_id`, `completed_at`, and `completed_by`. The completion checklist SHALL display color names from the `style_colors` relation (`style_color.color_name`), not from a separate `colors` table.

#### Scenario: Mark item as complete
- **WHEN** user clicks the completion checkbox for a PO-Style-Color item on the Weekly Order detail page AND the week status is `CONFIRMED`
- **THEN** system creates a `thread_order_item_completions` record with the item ID, current timestamp, and authenticated user's name

#### Scenario: Undo item completion
- **WHEN** user unchecks the completion checkbox for a previously completed item AND the week status is still `CONFIRMED` (not yet COMPLETED)
- **THEN** system deletes the corresponding `thread_order_item_completions` record

#### Scenario: Cannot mark item on non-CONFIRMED week
- **WHEN** user attempts to mark an item as complete on a week with status `DRAFT`, `CANCELLED`, or `COMPLETED`
- **THEN** system rejects the request with an error message

#### Scenario: Color name displayed from style_colors relation
- **WHEN** the completion checklist renders a PO-Style-Color item
- **THEN** the color name is read from `item.style_color.color_name` (not `item.color.name`)
