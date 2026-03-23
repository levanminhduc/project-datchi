## ADDED Requirements

### Requirement: Style cards are draggable

The system SHALL allow users to reorder Style cards via drag-and-drop to set allocation priority.

#### Scenario: Drag style card to new position
- **WHEN** user drags a Style card
- **AND** drops it at a different position
- **THEN** system SHALL reorder `perStyleResults` array
- **AND** visual order SHALL update immediately

#### Scenario: Drag handle visibility
- **WHEN** results are displayed in detail view
- **THEN** each Style card SHALL display a drag handle icon (≡) on the left side
- **AND** handle SHALL indicate draggable affordance

### Requirement: Reorder triggers recalculation

The system SHALL recalculate inventory preview when style order changes.

#### Scenario: Recalculate after reorder
- **WHEN** user completes drag-and-drop reorder
- **THEN** system SHALL debounce 300ms
- **THEN** system SHALL call `calculateAll()` with new position order
- **AND** inventory preview SHALL update to reflect new allocation priorities

#### Scenario: Cancel recalculation on rapid reorders
- **WHEN** user reorders multiple times within 300ms
- **THEN** system SHALL cancel pending recalculations
- **AND** only trigger final recalculation after 300ms idle

### Requirement: Position determines allocation priority

The system SHALL use visual position (array index) to determine allocation priority.

#### Scenario: First position gets priority
- **WHEN** Style A is at position 0 and Style B is at position 1
- **AND** both styles use the same thread type
- **THEN** Style A's calculation items SHALL be allocated first
- **AND** Style B receives remaining inventory

#### Scenario: Reorder changes priority
- **WHEN** user drags Style B to position 0 (above Style A)
- **THEN** Style B SHALL receive allocation priority
- **AND** recalculation SHALL reflect new priority order

### Requirement: Position persists in session

The system SHALL maintain position order throughout the session.

#### Scenario: Position survives recalculation
- **WHEN** user reorders styles
- **AND** calculation completes
- **THEN** visual order SHALL match user-defined order
- **AND** position SHALL NOT reset to original order

#### Scenario: Position resets on clear
- **WHEN** user clears all entries via "Xóa tất cả"
- **THEN** position tracking SHALL reset
- **AND** subsequent entries SHALL use insertion order

### Requirement: Install vuedraggable dependency

The system SHALL use `vuedraggable` package for drag-and-drop functionality.

#### Scenario: Package installation
- **WHEN** implementing drag-and-drop feature
- **THEN** `vuedraggable` (Vue 3 compatible version) SHALL be added to package.json
- **AND** package SHALL be imported in `ResultsDetailView.vue`
