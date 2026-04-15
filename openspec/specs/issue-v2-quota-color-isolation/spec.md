## ADDED Requirements

### Requirement: Issued quantity queries filter by thread_color_id
All functions that query `thread_issue_lines` to compute issued quantities SHALL accept an optional `threadColorId` parameter. When `threadColorId` is a number, the query MUST add `.eq('thread_color_id', threadColorId)`. When `threadColorId` is explicitly `null`, the query MUST add `.is('thread_color_id', null)`. When `threadColorId` is `undefined`, no color filter SHALL be applied.

Affected functions:
- `getConfirmedIssuedEquivalent()`
- `getConfirmedIssuedEquivalentByDept()`
- `_getConfirmedIssuedGross()`

#### Scenario: Issued query with specific thread color
- **WHEN** `getConfirmedIssuedEquivalent()` is called with `threadColorId = 42` (C9700)
- **THEN** only issue lines where `thread_color_id = 42` SHALL be summed; issue lines with other `thread_color_id` values (e.g., C5393) SHALL be excluded

#### Scenario: Issued query with null thread color
- **WHEN** `getConfirmedIssuedEquivalent()` is called with `threadColorId = null`
- **THEN** only issue lines where `thread_color_id IS NULL` SHALL be summed

#### Scenario: Issued query with undefined thread color (backward compat)
- **WHEN** `getConfirmedIssuedEquivalent()` is called without `threadColorId` parameter
- **THEN** all issue lines matching the other filters SHALL be summed regardless of their `thread_color_id` value

### Requirement: Department quota is capped by global remaining
When computing quota for a department that has a `dept_product_allocation`, the result MUST be capped by the global remaining quota. The formula SHALL be: `min(deptRemaining, globalRemaining)` where `deptRemaining = deptBaseQuota - deptIssuedNet` and `globalRemaining = globalBaseQuota - globalIssuedAllDepts`.

This applies to both:
- `getQuotaCones()` in `issuesV2.ts`
- `batchGetQuotaCones()` in `issue-v2-batch-quota.ts`

#### Scenario: Department has remaining but global is exhausted
- **WHEN** DK06 has issued 403 cones of C9700 (global limit 403), and DK01 has department allocation allowing 100 cones of C9700 with 0 issued
- **THEN** DK01's remaining quota for C9700 SHALL be `min(100, 0) = 0`

#### Scenario: Global has remaining but department is exhausted
- **WHEN** global remaining is 50 cones and DK01's department remaining is 0
- **THEN** DK01's remaining quota SHALL be `min(0, 50) = 0`

#### Scenario: Both department and global have remaining
- **WHEN** global remaining is 50 cones and DK01's department remaining is 30
- **THEN** DK01's remaining quota SHALL be `min(30, 50) = 30`

#### Scenario: Department without allocation (unallocated remainder)
- **WHEN** a department has no `dept_product_allocation` record
- **THEN** the existing unallocated-remainder logic SHALL continue to apply (no change to current behavior)

#### Scenario: Global base quota is null (no confirmed weeks or no spec)
- **WHEN** there are no confirmed weekly order items for a given PO/style/color/thread_type/thread_color combination
- **THEN** the global remaining SHALL be `null`, and the dept remaining SHALL also be `null` (cannot compute quota)

#### Scenario: Global base quota is null but dept allocation exists
- **WHEN** a department has a `dept_product_allocation` record but the global base quota is `null`
- **THEN** the dept remaining SHALL be `null` (global null propagates through min() logic)

### Requirement: Base quota sums all matching spec rows
`_getBaseQuotaCones()` MUST sum `meters_per_unit` across ALL matching spec rows for the given thread_type_id + thread_color_id + style_id combination, not just the first match. The spec filter MUST match by `style_id` (via nested `style_thread_specs`) AND by `thread_color_id` when provided.

#### Scenario: Multiple spec rows for same thread type and color
- **WHEN** a style-color has two spec entries for the same thread_type+thread_color with `meters_per_unit` values 240 and 59
- **THEN** total consumption SHALL be `240 + 59 = 299` meters per unit, not 240 or 59 alone

#### Scenario: Spec filter distinguishes thread colors
- **WHEN** a style-color has specs for both C9700 (meters_per_unit=240+59) and C5393 (meters_per_unit=5)
- **THEN** querying base quota for C9700 SHALL use 299 m/unit, and querying for C5393 SHALL use 5 m/unit

### Requirement: Thread color lookup returns all matching colors
`batchLookupThreadColorIds()` MUST return all matching `thread_color_id` values for each `thread_type_id + style_color_id` key, not just the first one found. The return type SHALL be `Map<string, number[]>`.

#### Scenario: Multiple thread colors exist for same thread type
- **WHEN** thread_type T-2-TEX40 has both C9700 and C5393 for style_color SC-001
- **THEN** the lookup SHALL return `[42, 15]` (both color IDs) for key `T2-SC001`, not just `[42]`

#### Scenario: Callers prefer explicit thread_color_id from frontend
- **WHEN** a single-item caller (`lookupThreadColorId` path in validate-line, add-line, create-with-line) receives `thread_color_id` from the frontend request body
- **THEN** the caller SHALL use the explicit value directly and SHALL NOT rely on lookup for that line

#### Scenario: Batch lookup caller handles multiple colors
- **WHEN** the `GET /api/issues/v2/:id` enrichment path uses `batchLookupThreadColorIds()` to resolve thread_color_ids
- **THEN** it SHALL receive `number[]` (all matching colors) per key and handle accordingly

#### Scenario: Caller preserves explicit null thread_color_id
- **WHEN** a caller receives `thread_color_id: null` from the frontend request body (explicit "no color")
- **THEN** the caller SHALL pass `null` (not `undefined`) to downstream functions, and SHALL NOT trigger lookup fallback. Callers MUST use `!== undefined` check, not `??` operator, to distinguish explicit null from absent value.

### Requirement: All issued queries have row limits
All Supabase `.select()` queries on `thread_issue_lines` that can return multiple rows MUST include `.limit(10000)` to comply with project conventions.

#### Scenario: getConfirmedIssuedEquivalent query has limit
- **WHEN** `getConfirmedIssuedEquivalent()` executes its Supabase query
- **THEN** the query chain MUST include `.limit(10000)`

#### Scenario: getConfirmedIssuedEquivalentByDept query has limit
- **WHEN** `getConfirmedIssuedEquivalentByDept()` executes its Supabase query
- **THEN** the query chain MUST include `.limit(10000)`

#### Scenario: _getConfirmedIssuedGross query has limit
- **WHEN** `_getConfirmedIssuedGross()` executes its Supabase query
- **THEN** the query chain MUST include `.limit(10000)`
