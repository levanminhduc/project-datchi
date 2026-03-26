## [2026-03-13] Round 1 (from spx-apply milestone verify)

### spx-verifier
- Fixed: [CRITICAL] POOrderCard `@update-sub-art` emit missing `oldSubArtId` parameter — added 5th parameter to emit signature and handler
- Fixed: POOrderCard emit type definition updated to include `oldSubArtId: number | null | undefined`
- Verified: `removeStyle` and color operations already correctly use `subArtId` for entry lookup
- Verified: Backend `validateSubArtIds` correctly handles null by skipping validation
- Verified: `canCalculate` + `canCalculateReason` properly combine quantity check and sub-art check with clear Vietnamese messages
- Verified: Tooltip on "Tính toán" button correctly shows reason when disabled

### spx-arch-verifier
- No issues found — all patterns follow existing project conventions (issuesV2.ts validateSubArtId pattern, subArtService reuse, AppSelect usage)

## [2026-03-13] Round 2 (from spx-apply auto-verify)

### spx-verifier
- Fixed: [WARNING] `sub_art_id: entry.sub_art_id || null` → `?? null` in save payload (index.vue:489) for defensive coding
- Accepted: validateSubArtIds sequential queries (S2) — typical usage <20 items

### spx-arch-verifier
- Accepted: [WARNING] validateSubArtIds weaker than issuesV2 — intentional per design D5 (sub-art informational only, frontend enforces mandatory via canCalculate)
- Accepted: [S2] Direct Map mutation for subArtRequired — acceptable for reactive Maps shared between composable/components
- Accepted: [S4] `|| null` already fixed in Round 2 spx-verifier
