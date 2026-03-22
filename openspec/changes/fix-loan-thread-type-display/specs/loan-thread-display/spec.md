## ADDED Requirements

### Requirement: Loan list displays thread type as NCC-TEX-Color format
The loan list table in `loans.vue` SHALL display thread types using the format `"Supplier Name - TEX xxx - Color Name"` instead of `code + name`.

#### Scenario: Loan with complete thread type data
- **WHEN** a loan record has a thread_type with supplier_id linked to a supplier and color_id linked to a color
- **THEN** the "Loại chỉ" column SHALL display `"Coats Việt Nam - TEX 40 - Trắng"` format

#### Scenario: Loan with missing supplier
- **WHEN** a loan record has a thread_type with supplier_id = NULL
- **THEN** the "Loại chỉ" column SHALL fall back to displaying `thread_type.name`

#### Scenario: Loan with missing color
- **WHEN** a loan record has a thread_type with color_id = NULL
- **THEN** the "Loại chỉ" column SHALL display `"Supplier Name - TEX xxx"` omitting the color segment

### Requirement: Backend loans/all endpoint provides supplier and color data
The `/api/weekly-orders/loans/all` endpoint SHALL return thread_type objects that include `tex_number`, nested `supplier` with `name`, and nested `color` with `name`.

#### Scenario: API response includes enriched thread type
- **WHEN** the frontend calls GET `/api/weekly-orders/loans/all`
- **THEN** each loan object's `thread_type` field SHALL contain `{ id, code, name, tex_number, supplier: { name }, color: { name } }`

### Requirement: Detail-by-type breakdown includes supplier name
The `fn_loan_detail_by_thread_type` RPC function SHALL return `supplier_name` and `tex_number` for each thread type row.

#### Scenario: Expanded week detail shows NCC-TEX-Color
- **WHEN** user expands a week row in the summary table
- **THEN** the detail table SHALL display thread types using `"Supplier Name - TEX xxx - Color Name"` format instead of separate code/name/color columns

### Requirement: LoanDialog thread selection shows NCC-TEX-Color format
The `LoanDialog.vue` thread selection table SHALL display thread types using `"Supplier Name - TEX xxx - Color Name"` format.

#### Scenario: Thread selection table in loan creation
- **WHEN** user opens the loan dialog and selects a source week
- **THEN** the thread list SHALL show a single "Loại chỉ" column with `"Supplier Name - TEX xxx - Color Name"` format instead of separate "Mã chỉ" and "Tên chỉ" columns

### Requirement: TypeScript types include supplier and color in thread_type
The `ThreadOrderLoan` interface's `thread_type` field SHALL include `tex_number`, `supplier`, and `color` nested objects. The `LoanDetailByType` interface SHALL include `supplier_name` and `tex_number`.

#### Scenario: Type definition matches API response
- **WHEN** the API returns enriched thread_type data
- **THEN** the TypeScript type SHALL match without type errors: `thread_type?: { id: number; code: string; name: string; tex_number: string | null; supplier?: { name: string } | null; color?: { name: string } | null }`
