## [2026-03-13] Round 1 (from spx-apply auto-verify)

### spx-verifier
- Fixed: [CRITICAL] Backend import endpoint now parses uploaded Excel file via `c.req.parseBody()` + ExcelJS instead of `c.req.json()` — matches frontend FormData submission
- Fixed: [WARNING] `ImportSubArtResult` type now includes `sub_art_code` in warnings array to match backend response

### spx-arch-verifier
- Fixed: [CRITICAL] Same as spx-verifier — backend now handles multipart file upload correctly
- Fixed: [CRITICAL] No longer sends FormData with Content-Type: application/json — `c.req.parseBody()` handles multipart natively
- Fixed: [WARNING] `ImportSubArtResult` warnings type now includes `sub_art_code`
- Skipped: [WARNING] `sub_arts` table missing `updated_at`/`deleted_at` — intentional for lookup/reference table
- Skipped: [WARNING] Sequential N+1 inserts — acceptable for expected import volume
- Skipped: [WARNING] Import page uses raw `q-table` — per spec design, acceptable for warnings display

### spx-uiux-verifier
- Fixed: [CRITICAL] Same as above — import flow now works end-to-end
- Fixed: [WARNING] `ImportSubArtResult` warnings type complete

## [2026-03-13] Round 2 (from re-verify)

### spx-verifier
- Fixed: [CRITICAL] `subArtService.importExcel()` now uses `fetchApiRaw()` instead of `fetchApi()` to avoid forcing `Content-Type: application/json` on FormData — browser auto-sets `multipart/form-data; boundary=...`
- Fixed: [WARNING] `ImportSubArtResult` type now includes `warnings_count` field to match backend response
