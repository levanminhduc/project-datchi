## ADDED Requirements

### Requirement: Backend route files update tex_id references
All backend route files referencing `tex_id` SHALL be updated to use `thread_type_id`. This includes PostgREST nested select syntax (`thread_types:tex_id(...)` → `thread_types:thread_type_id(...)`), insert/update field names, and type definitions.

#### Scenario: styleThreadSpecs route updated
- **WHEN** `server/routes/styleThreadSpecs.ts` is updated
- **THEN** all PostgREST `.select()` calls use `thread_types:thread_type_id(...)` syntax, and insert/update operations reference `thread_type_id` field

#### Scenario: styles route updated
- **WHEN** `server/routes/styles.ts` is updated
- **THEN** the nested select for style_thread_specs uses `thread_type_id` instead of `tex_id`

#### Scenario: threadCalculation route updated
- **WHEN** `server/routes/threadCalculation.ts` is updated
- **THEN** the type definition, PostgREST queries, and fallback assignments all reference `thread_type_id` instead of `tex_id`

### Requirement: Frontend type definitions update tex_id references
The TypeScript type file `src/types/thread/styleThreadSpec.ts` SHALL replace all `tex_id` field references with `thread_type_id` in all type/interface definitions.

#### Scenario: StyleThreadSpec type updated
- **WHEN** `src/types/thread/styleThreadSpec.ts` is updated
- **THEN** all interfaces (`StyleThreadSpec`, `StyleThreadSpecCreate`, `StyleThreadSpecUpdate`) use `thread_type_id` instead of `tex_id`

### Requirement: Frontend Vue component update tex_id references
The Vue component `src/pages/thread/styles/[id].vue` SHALL replace all `tex_id` references with `thread_type_id` in template bindings, inline edit handlers, and field type definitions.

#### Scenario: Inline edit column updated
- **WHEN** `src/pages/thread/styles/[id].vue` is updated
- **THEN** the inline edit loading key, v-model binding, save handler, and field type union all use `thread_type_id` instead of `tex_id`

### Requirement: TypeScript types regenerated
After migration, TypeScript database types SHALL be regenerated using `supabase gen types typescript` to reflect the new column name and enum types.

#### Scenario: Types reflect schema changes
- **WHEN** `supabase gen types typescript --local` is run after migration
- **THEN** generated types show `thread_type_id` in `style_thread_specs`, `conflict_status` enum type, and `cone_status` type for `from_status`/`to_status` in `thread_movements`
