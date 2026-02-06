# Thread Specification Feature - Issues & Gotchas

## Known Issues
None yet - document as they arise.

## Potential Gotchas
1. **thread_types structure**: Need to verify existing table structure before creating FKs
2. **Color filtering**: Must ensure color_supplier junction table is used correctly for NCC → Color filtering
3. **Allocation integration**: Existing allocation uses thread_type_id - our specs must output compatible data

## Blockers
None currently.
