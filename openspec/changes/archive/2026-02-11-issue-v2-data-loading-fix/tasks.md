## 1. Backend - Form Data Endpoint Fix

- [x] 1.1 Verify deduplication logic exists in `server/routes/issuesV2.ts` `/form-data` endpoint
- [x] 1.2 Test deduplication with curl after server restart
- [x] 1.3 Add empty array handling when no specs found (return `thread_types: []` not error)

## 2. Frontend - Race Condition Fix

- [x] 2.1 In `src/pages/thread/issues/v2/index.vue`, modify `handleLoadFormData()` to use returned data directly
- [x] 2.2 Change from `for (const tt of threadTypes.value)` to `for (const tt of data.thread_types)`
- [x] 2.3 Add null check before iterating: `if (data?.thread_types)`

## 3. Frontend - Template Null Checks

- [x] 3.1 Add optional chaining to `lineInputs[props.row.thread_type_id]?.full`
- [x] 3.2 Add optional chaining to `lineInputs[props.row.thread_type_id]?.partial`
- [x] 3.3 Add optional chaining to `lineInputs[props.row.thread_type_id]?.notes`
- [x] 3.4 Add fallback values using `?? 0` for number fields

## 4. Testing

- [ ] 4.1 Restart server and verify `/api/issues/v2/form-data` returns unique thread types
- [ ] 4.2 Test page load with confirmed weekly order (PO → Style → Color selection)
- [ ] 4.3 Verify no Vue console errors when loading thread data
- [ ] 4.4 Test empty state when no specs exist for a style+color
