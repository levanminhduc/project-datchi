# AppSelect Behavior Prop Fix

## Overview

Fix AppSelect dropdown popup not opening when `use-input=false` by adding explicit `behavior` prop with default `'dialog'` mode. This ensures consistent popup behavior regardless of input mode setting.

## User Stories

### Story 1: Consistent Popup Opening (Priority: P1) 🎯 MVP

As a developer using AppSelect component, I want the dropdown popup to open consistently regardless of use-input prop value, so that users can always access the options list.

**Independent Test**: Render AppSelect with `use-input=false`, click on it, verify popup opens in dialog mode.

**Acceptance Criteria**:
- [x] WHEN user clicks on AppSelect with use-input=false, THE SYSTEM SHALL open popup in dialog mode
- [x] WHEN user clicks on AppSelect with use-input=true, THE SYSTEM SHALL open popup and maintain existing search behavior
- [x] WHEN behavior prop is set to 'menu', THE SYSTEM SHALL display popup as menu dropdown
- [x] WHEN behavior prop is set to 'dialog', THE SYSTEM SHALL display popup as dialog overlay
- [x] WHEN behavior prop is not specified, THE SYSTEM SHALL default to 'dialog' mode

## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Default behavior | `'dialog'` | Dialog mode works reliably when use-input=false; Quasar's default 'menu' can fail to open | `'menu'` (Quasar default) |
| Prop type | `'menu' \| 'dialog'` | Matches Quasar QSelect behavior prop exactly | string, enum |
| Breaking change | No | Adding new optional prop with sensible default | Change useInput default |

## Out of Scope

- Behavior prop interaction with mobile devices (uses Quasar native mobile handling)
- Custom popup positioning beyond Quasar's behavior modes
- Popup animation customization

## Implementation Notes

**Completed**: 2026-01-29

**Files Modified**:
- `src/types/ui/inputs.ts` - Added `behavior?: 'menu' | 'dialog'` prop (line 97-98)
- `src/components/ui/inputs/AppSelect.vue` - Added `:behavior` binding (line 26) and default (line 81)

**Default Behavior**: 'dialog' mode - ensures popup opens consistently on all devices and use-input configurations.

**Backward Compatibility**: 100% - existing usages without explicit behavior prop will use the default 'dialog' mode.
