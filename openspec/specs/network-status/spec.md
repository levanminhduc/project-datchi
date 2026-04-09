## ADDED Requirements

### Requirement: Reactive network status composable
The system SHALL provide a `useNetworkStatus()` composable that exposes reactive `isOnline` (boolean) state reflecting the browser's connectivity status via `navigator.onLine` and `online`/`offline` window events.

#### Scenario: Initial state reflects browser connectivity
- **WHEN** `useNetworkStatus()` is called
- **THEN** `isOnline` SHALL equal `navigator.onLine`

#### Scenario: State updates on offline event
- **WHEN** the browser fires a `window` `offline` event
- **THEN** `isOnline` SHALL become `false`

#### Scenario: State updates on online event
- **WHEN** the browser fires a `window` `online` event
- **THEN** `isOnline` SHALL become `true`

### Requirement: Singleton state across components
The `useNetworkStatus()` composable SHALL use module-level state so all consumers share the same reactive references.

#### Scenario: Multiple components see same state
- **WHEN** two components call `useNetworkStatus()`
- **THEN** both SHALL receive the same `isOnline` ref (referential equality)

### Requirement: Network transition snackbar notifications
The system SHALL show snackbar notifications on network status transitions after initialization.

#### Scenario: Going offline shows warning
- **WHEN** the network status transitions from online to offline
- **THEN** the system SHALL show a snackbar with message "Mat ket noi mang" (Vietnamese: "Mất kết nối mạng")

#### Scenario: Coming back online shows success
- **WHEN** the network status transitions from offline to online
- **AND** the user was previously offline (`wasOffline` is true)
- **THEN** the system SHALL show a success snackbar with message "Da ket noi mang tro lai" (Vietnamese: "Đã kết nối mạng trở lại")

### Requirement: Initialization function
The composable SHALL export an `initNetworkStatus()` function that registers the window event listeners and enables snackbar notifications. This function SHALL be called once from the main layout.

#### Scenario: Event listeners registered on init
- **WHEN** `initNetworkStatus()` is called
- **THEN** `online` and `offline` event listeners SHALL be registered on `window`

#### Scenario: No duplicate listeners on multiple init calls
- **WHEN** `initNetworkStatus()` is called more than once
- **THEN** event listeners SHALL NOT be registered again

### Requirement: Global offline banner component
The system SHALL provide a `NetworkStatusBanner` component that displays a persistent warning banner when the user is offline.

#### Scenario: Banner visible when offline
- **WHEN** `isOnline` is `false`
- **THEN** the banner SHALL be visible with text "Ban dang mat ket noi mang. Mot so chuc nang co the khong hoat dong." (Vietnamese: "Bạn đang mất kết nối mạng. Một số chức năng có thể không hoạt động.")
- **AND** the banner SHALL use warning styling (yellow/orange background)

#### Scenario: Banner hidden when online
- **WHEN** `isOnline` is `true`
- **AND** the user was NOT recently offline
- **THEN** the banner SHALL NOT be visible

#### Scenario: Brief success state on reconnection
- **WHEN** `isOnline` transitions from `false` to `true`
- **THEN** the banner SHALL show a success message "Da ket noi lai" (Vietnamese: "Đã kết nối lại") with success styling for 3 seconds
- **AND** after 3 seconds the banner SHALL hide

### Requirement: Banner integrated in main layout
The `NetworkStatusBanner` SHALL be placed in `App.vue` inside `q-page-container` before the `router-view` so it is visible on all pages.

#### Scenario: Banner visible on any page when offline
- **WHEN** the user is on any page and goes offline
- **THEN** the offline banner SHALL be visible regardless of current route

#### Scenario: Banner not shown on login page when not authenticated
- **WHEN** the user is on the login page
- **THEN** the banner SHALL still be visible if offline (network status is independent of auth state)
