## Why

The Issue V2 page (`/thread/issues/v2`) fails to load thread data with error "Không thể tải dữ liệu form". Root causes identified:
1. Backend returns duplicate `thread_type_id` values causing Vue render errors
2. Frontend has race condition where `lineInputs` initializes before `threadTypes` data arrives
3. Missing null checks in template bindings cause runtime crashes

## What Changes

- **Backend `/api/issues/v2/form-data`**: Fix deduplication logic and ensure unique thread types returned
- **Frontend Issue V2 page**: Fix race condition in `lineInputs` initialization
- **Frontend template**: Add defensive null checks to prevent crashes
- **Backend query optimization**: Reduce N+1 queries for stock/quota lookups

## Capabilities

### New Capabilities

(None - this is a bug fix change)

### Modified Capabilities

- `thread-issue-v2`: Fix data loading bugs in form-data endpoint and page initialization

## Impact

- **Backend**: `server/routes/issuesV2.ts` - form-data endpoint logic
- **Frontend**: `src/pages/thread/issues/v2/index.vue` - initialization and template
- **Frontend**: `src/composables/thread/useIssueV2.ts` - data loading flow
- **No database changes required** - schema is correct, only query/code bugs
