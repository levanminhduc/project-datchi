---
spec_version: "1.0"
feature: "thread-management"
level: 3
status: "active"
created: "2026-02-03"
updated: "2026-02-03"
tags: ["database", "migration", "normalization", "thread", "restructure"]
---

<!-- @SECTION:OVERVIEW -->
# Thread Management System - Hierarchical Restructure

Restructure thread management from a flat table with free-text fields to a normalized hierarchical model with master tables for colors and suppliers. This enables data consistency, eliminates duplicate supplier data between `thread_types` and `lots` tables, and prevents typos in color names.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=pending mvp=true -->
### US-001: Color Master Table with Standardized Names (P1) 🎯 MVP

As a warehouse manager, I want standardized color names with associated codes (hex, Pantone, RAL) so that color selection is consistent across all thread types and eliminates typos.

**Independent Test**: Create a new color via API, verify it appears in database with all code fields stored correctly.
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=pending mvp=true -->
### US-002: Supplier Master Table with Contact Info (P1) 🎯 MVP

As a procurement officer, I want a centralized supplier database with contact information so that I can manage supplier relationships and avoid duplicate free-text entries.

**Independent Test**: Create a new supplier via API with contact details, verify all fields are stored and retrievable.
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=pending mvp=true -->
### US-003: Color-Supplier Pricing Junction (P1) 🎯 MVP

As a procurement officer, I want to track which suppliers provide which colors with their respective pricing so that I can compare costs and manage minimum order quantities per color-supplier combination.

**Independent Test**: Create color_supplier junction record linking existing color and supplier, verify price_per_kg and min_order_qty are stored.
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P1 status=pending mvp=true -->
### US-004: Thread Types FK Migration (P1) 🎯 MVP

As a system administrator, I want thread_types to reference colors and suppliers via foreign keys so that data integrity is enforced at the database level while maintaining backward compatibility during migration.

**Independent Test**: Add FK columns to thread_types, create thread type with both legacy fields AND FK references, verify dual-write works.
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P1 status=pending mvp=true -->
### US-005: Lots Supplier FK Migration (P1) 🎯 MVP

As a system administrator, I want lots to reference suppliers via foreign key instead of free-text so that supplier data is consistent between thread_types and lots tables.

**Independent Test**: Add supplier_id FK to lots table, verify existing lots can be backfilled from supplier name matching.
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P2 status=pending mvp=false -->
### US-006: Data Migration and Backfill (P2)

As a system administrator, I want existing free-text color and supplier data migrated to the new normalized tables so that all historical data references the master tables correctly.

**Independent Test**: Run migration scripts on test data, verify all unique color names create color records, all unique supplier names create supplier records, and all thread_types/lots have valid FKs.
<!-- @END:STORY:US-006 -->

<!-- @STORY:US-007 priority=P2 status=pending mvp=false -->
### US-007: Color CRUD API (P2)

As a developer, I want CRUD API endpoints for colors so that frontend components can manage the color master data.

**Independent Test**: Test GET/POST/PUT/DELETE /api/colors endpoints, verify proper response format and Vietnamese error messages.
<!-- @END:STORY:US-007 -->

<!-- @STORY:US-008 priority=P2 status=pending mvp=false -->
### US-008: Supplier CRUD API (P2)

As a developer, I want CRUD API endpoints for suppliers so that frontend components can manage the supplier master data.

**Independent Test**: Test GET/POST/PUT/DELETE /api/suppliers endpoints, verify proper response format and Vietnamese error messages.
<!-- @END:STORY:US-008 -->

<!-- @STORY:US-009 priority=P2 status=pending mvp=false -->
### US-009: ColorSelector Vue Component (P2)

As a user, I want a ColorSelector dropdown component so that I can choose from standardized colors with visual preview when creating/editing thread types.

**Independent Test**: Mount ColorSelector component, verify it fetches colors, displays color swatches, and emits selected color_id.
<!-- @END:STORY:US-009 -->

<!-- @STORY:US-010 priority=P2 status=pending mvp=false -->
### US-010: SupplierSelector Vue Component (P2)

As a user, I want a SupplierSelector dropdown component so that I can choose from existing suppliers when creating/editing thread types or lots.

**Independent Test**: Mount SupplierSelector component, verify it fetches suppliers, displays supplier name with code, and emits selected supplier_id.
<!-- @END:STORY:US-010 -->

<!-- @STORY:US-011 priority=P2 status=pending mvp=false -->
### US-011: Update ThreadTypeFormDialog (P2)

As a user, I want the thread type form to use ColorSelector and SupplierSelector components instead of free-text inputs so that I always select from standardized values.

**Independent Test**: Open ThreadTypeFormDialog, verify ColorSelector and SupplierSelector are rendered, submit form with selected values, verify color_id and supplier_id are sent to API.
<!-- @END:STORY:US-011 -->

<!-- @STORY:US-012 priority=P3 status=pending mvp=false -->
### US-012: Update Thread Page Filters (P3)

As a user, I want to filter thread types by color and supplier using dropdowns instead of text search so that filtering is more accurate.

**Independent Test**: On thread types list page, verify color filter shows ColorSelector dropdown, supplier filter shows SupplierSelector dropdown, and filtering works with FK values.
<!-- @END:STORY:US-012 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:database story=US-001,US-002,US-003 -->
### Database Schema

<!-- @AC:AC-001 status=pending -->
- [ ] **AC-001**: THE SYSTEM SHALL create a `colors` table with columns: id (PK), name (unique), hex_code, pantone_code, ral_code, created_at, updated_at.
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=pending -->
- [ ] **AC-002**: THE SYSTEM SHALL create a `suppliers` table with columns: id (PK), code (unique), name, contact_name, phone, email, created_at, updated_at.
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=pending -->
- [ ] **AC-003**: THE SYSTEM SHALL create a `color_supplier` junction table with columns: id (PK), color_id (FK), supplier_id (FK), price_per_kg, min_order_qty, with unique constraint on (color_id, supplier_id).
<!-- @END:AC:AC-003 -->

<!-- @AC:AC-004 status=pending -->
- [ ] **AC-004**: THE SYSTEM SHALL add nullable columns color_id, supplier_id, color_supplier_id to `thread_types` table with foreign key constraints.
<!-- @END:AC:AC-004 -->

<!-- @AC:AC-005 status=pending -->
- [ ] **AC-005**: THE SYSTEM SHALL add nullable column supplier_id to `lots` table with foreign key constraint.
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=pending -->
- [ ] **AC-006**: THE SYSTEM SHALL create indexes on all new FK columns for query performance.
<!-- @END:AC:AC-006 -->

<!-- @END:CRITERIA_GROUP:database -->

<!-- @CRITERIA_GROUP:migration story=US-004,US-005,US-006 -->
### Data Migration (Expand-Contract Pattern)

<!-- @AC:AC-007 status=pending -->
- [ ] **AC-007**: WHILE in expand phase, THE SYSTEM SHALL keep existing color VARCHAR and supplier VARCHAR columns alongside new FK columns.
<!-- @END:AC:AC-007 -->

<!-- @AC:AC-008 status=pending -->
- [ ] **AC-008**: WHEN creating/updating thread_types, THE SYSTEM SHALL dual-write to both legacy text columns AND new FK columns for backward compatibility.
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=pending -->
- [ ] **AC-009**: WHEN migration scripts run, THE SYSTEM SHALL extract unique color names from thread_types.color and create corresponding records in colors table.
<!-- @END:AC:AC-009 -->

<!-- @AC:AC-010 status=pending -->
- [ ] **AC-010**: WHEN migration scripts run, THE SYSTEM SHALL extract unique supplier names from thread_types.supplier and lots.supplier and create corresponding records in suppliers table.
<!-- @END:AC:AC-010 -->

<!-- @AC:AC-011 status=pending -->
- [ ] **AC-011**: WHEN backfill completes, THE SYSTEM SHALL update all thread_types with matching color_id and supplier_id values.
<!-- @END:AC:AC-011 -->

<!-- @AC:AC-012 status=pending -->
- [ ] **AC-012**: WHEN backfill completes, THE SYSTEM SHALL update all lots with matching supplier_id values.
<!-- @END:AC:AC-012 -->

<!-- @END:CRITERIA_GROUP:migration -->

<!-- @CRITERIA_GROUP:api story=US-007,US-008 -->
### Backend API

<!-- @AC:AC-013 status=pending -->
- [ ] **AC-013**: THE SYSTEM SHALL provide GET /api/colors endpoint returning array of colors with all fields.
<!-- @END:AC:AC-013 -->

<!-- @AC:AC-014 status=pending -->
- [ ] **AC-014**: THE SYSTEM SHALL provide POST /api/colors endpoint with duplicate name check returning 409 if exists.
<!-- @END:AC:AC-014 -->

<!-- @AC:AC-015 status=pending -->
- [ ] **AC-015**: THE SYSTEM SHALL provide PUT /api/colors/:id endpoint for updates.
<!-- @END:AC:AC-015 -->

<!-- @AC:AC-016 status=pending -->
- [ ] **AC-016**: THE SYSTEM SHALL provide DELETE /api/colors/:id endpoint with soft-delete or cascade check.
<!-- @END:AC:AC-016 -->

<!-- @AC:AC-017 status=pending -->
- [ ] **AC-017**: THE SYSTEM SHALL provide GET /api/suppliers endpoint returning array of suppliers with all fields.
<!-- @END:AC:AC-017 -->

<!-- @AC:AC-018 status=pending -->
- [ ] **AC-018**: THE SYSTEM SHALL provide POST /api/suppliers endpoint with duplicate code check returning 409 if exists.
<!-- @END:AC:AC-018 -->

<!-- @AC:AC-019 status=pending -->
- [ ] **AC-019**: THE SYSTEM SHALL provide PUT /api/suppliers/:id endpoint for updates.
<!-- @END:AC:AC-019 -->

<!-- @AC:AC-020 status=pending -->
- [ ] **AC-020**: THE SYSTEM SHALL provide DELETE /api/suppliers/:id endpoint with soft-delete or cascade check.
<!-- @END:AC:AC-020 -->

<!-- @AC:AC-021 status=pending -->
- [ ] **AC-021**: WHEN thread_types API returns data, THE SYSTEM SHALL include joined color_data and supplier_data objects for display.
<!-- @END:AC:AC-021 -->

<!-- @END:CRITERIA_GROUP:api -->

<!-- @CRITERIA_GROUP:frontend story=US-009,US-010,US-011,US-012 -->
### Frontend Components

<!-- @AC:AC-022 status=pending -->
- [ ] **AC-022**: THE SYSTEM SHALL create ColorSelector component following AppWarehouseSelect pattern with color swatch preview.
<!-- @END:AC:AC-022 -->

<!-- @AC:AC-023 status=pending -->
- [ ] **AC-023**: THE SYSTEM SHALL create SupplierSelector component following AppWarehouseSelect pattern with search capability.
<!-- @END:AC:AC-023 -->

<!-- @AC:AC-024 status=pending -->
- [ ] **AC-024**: WHEN ColorSelector loads, THE SYSTEM SHALL fetch colors from API and cache in composable state.
<!-- @END:AC:AC-024 -->

<!-- @AC:AC-025 status=pending -->
- [ ] **AC-025**: WHEN SupplierSelector loads, THE SYSTEM SHALL fetch suppliers from API and cache in composable state.
<!-- @END:AC:AC-025 -->

<!-- @AC:AC-026 status=pending -->
- [ ] **AC-026**: THE SYSTEM SHALL update ThreadTypeFormDialog to use ColorSelector for color selection.
<!-- @END:AC:AC-026 -->

<!-- @AC:AC-027 status=pending -->
- [ ] **AC-027**: THE SYSTEM SHALL update ThreadTypeFormDialog to use SupplierSelector for supplier selection.
<!-- @END:AC:AC-027 -->

<!-- @AC:AC-028 status=pending -->
- [ ] **AC-028**: THE SYSTEM SHALL update thread types list page filters to use ColorSelector for color filtering.
<!-- @END:AC:AC-028 -->

<!-- @AC:AC-029 status=pending -->
- [ ] **AC-029**: THE SYSTEM SHALL update thread types list page filters to use SupplierSelector for supplier filtering.
<!-- @END:AC:AC-029 -->

<!-- @END:CRITERIA_GROUP:frontend -->

<!-- @CRITERIA_GROUP:nonfunctional story=US-004,US-005 -->
### Non-Functional Requirements

<!-- @AC:AC-030 status=pending -->
- [ ] **AC-030**: THE SYSTEM SHALL perform migration with zero downtime using expand-contract pattern.
<!-- @END:AC:AC-030 -->

<!-- @AC:AC-031 status=pending -->
- [ ] **AC-031**: THE SYSTEM SHALL maintain backward-compatible API responses during migration period.
<!-- @END:AC:AC-031 -->

<!-- @AC:AC-032 status=pending -->
- [ ] **AC-032**: THE SYSTEM SHALL index all FK columns for optimal query performance.
<!-- @END:AC:AC-032 -->

<!-- @END:CRITERIA_GROUP:nonfunctional -->

<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:SUCCESS_METRICS -->
## Success Metrics

| Metric | Target |
|--------|--------|
| Color name typos | 0 (standardized via dropdown) |
| Duplicate supplier entries | 0 (unified master table) |
| API backward compatibility | 100% (dual-write during migration) |
| Migration downtime | 0 minutes |
| FK index coverage | 100% (all FK columns indexed) |
<!-- @END:SUCCESS_METRICS -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Migration pattern | Expand-Contract | Zero-downtime, reversible, proven pattern | Big-bang migration |
| FK nullability | Nullable during migration | Allows gradual backfill | Required from start |
| Soft delete | Yes for colors/suppliers | Prevents FK violations | Hard delete with cascade |
| Color codes | Optional (hex, pantone, ral) | Not all colors have all codes | Required fields |
| Supplier code | Unique, required | Enables quick identification | Auto-generated |
| Dual-write period | Until contract phase | Backward compatibility | Immediate switchover |
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- Color image/swatch uploads (only hex codes for preview)
- Supplier rating or performance tracking
- Historical pricing changes (only current price stored)
- Multi-currency pricing (assumes single currency)
- Contract phase (dropping legacy columns) - separate spec
- Color/supplier import from external systems
<!-- @END:OUT_OF_SCOPE -->

<!-- @SECTION:CONTEXT -->
## Context

**Current State Analysis**:
- See `server/types/thread.ts:59-75` for ThreadTypeRow with free-text color/supplier
- See `src/types/thread/lot.ts:15-52` for Lot with free-text supplier
- See `supabase/migrations/20240101000001_thread_types.sql:40-77` for current schema
- See `supabase/migrations/20240101000016_lots.sql:27-46` for lots schema

**Target State Pattern**:
- See `src/components/ui/inputs/AppWarehouseSelect.vue` for selector component pattern
- See `src/composables/useWarehouses.ts` for composable data fetching pattern
- See `server/routes/threads.ts` for CRUD route pattern with Vietnamese messages

**Existing TODOs in codebase**: 132 TODO comments marked with `thread-restructure-XXX` pattern
<!-- @END:CONTEXT -->
