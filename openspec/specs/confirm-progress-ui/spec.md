## ADDED Requirements

### Requirement: Step-by-step confirmation progress dialog
The system SHALL display a modal dialog showing the progress of the weekly order confirmation as a sequence of named steps, each with an independent status indicator.

#### Scenario: Dialog opens with all steps pending
- **WHEN** the user initiates weekly order confirmation
- **THEN** the system SHALL display a dialog with 4 steps, all in "pending" status: "Luu don hang", "Xac nhan & dat truoc chi", "Dong bo giao hang", "Gui thong bao"

#### Scenario: Step transitions to loading
- **WHEN** the system begins executing a confirmation step
- **THEN** that step's status indicator SHALL change to a loading spinner and the step label SHALL be visually highlighted

#### Scenario: Step completes successfully
- **WHEN** a confirmation step finishes without error
- **THEN** that step's status indicator SHALL change to a success checkmark and the next step SHALL begin executing

#### Scenario: Step fails with error
- **WHEN** a confirmation step fails
- **THEN** that step's status indicator SHALL change to an error icon, the step SHALL display the error message, and no subsequent steps SHALL execute

#### Scenario: Progress bar reflects completion
- **WHEN** 2 of 4 steps have completed successfully
- **THEN** the progress bar SHALL show 50% completion

### Requirement: Dialog dismissal rules
The system SHALL prevent premature dismissal of the confirmation dialog while steps are in progress.

#### Scenario: Cannot dismiss while loading
- **WHEN** any step has status "loading"
- **THEN** the dialog SHALL NOT be dismissible (no close button, clicking outside does not close, ESC does not close)

#### Scenario: Can dismiss after completion
- **WHEN** all steps have status "success"
- **THEN** the dialog SHALL display a "Dong" button that closes the dialog

#### Scenario: Can dismiss after error
- **WHEN** any step has status "error" and no step has status "loading"
- **THEN** the dialog SHALL display a "Dong" button that closes the dialog

### Requirement: Sequential step execution with error gating
The system SHALL execute confirmation steps sequentially, stopping at the first failure.

#### Scenario: All steps succeed
- **WHEN** the user confirms a weekly order and all 4 steps complete successfully
- **THEN** the system SHALL update local state, show success notification, and refresh the week list

#### Scenario: Save step fails
- **WHEN** the "Luu don hang" step fails (saveResults returns error)
- **THEN** the system SHALL NOT proceed to the confirmation step, and the dialog SHALL show the error on step 1

#### Scenario: Confirm step timeout with backend success
- **WHEN** the "Xac nhan & dat truoc chi" step times out but the backend has already confirmed
- **THEN** the system SHALL re-fetch the week status, detect CONFIRMED, and treat the step as successful

#### Scenario: Sync deliveries step fails
- **WHEN** the "Dong bo giao hang" step fails
- **THEN** the system SHALL NOT proceed to the notification step, and the dialog SHALL show the error on step 3 (the order remains confirmed but deliveries are not synced)
