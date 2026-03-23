## [2026-03-23] Round 1 (from spx-apply auto-verify)

### spx-uiux-verifier
- Fixed: Added `|| []` fallback to `row.borrowed_groups` iteration in `allBorrowedGroups` computed (line 609 of [id].vue) to prevent crash if API returns undefined for borrowed_groups
