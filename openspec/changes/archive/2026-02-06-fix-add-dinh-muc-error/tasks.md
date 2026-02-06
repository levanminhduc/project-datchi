## 1. Backend Fix

- [ ] 1.1 Xóa validation `process_name` required trong `server/routes/styleThreadSpecs.ts` POST endpoint (line 98-100)

## 2. Verification

- [ ] 2.1 Test click "Thêm định mức" → row mới được tạo thành công
- [ ] 2.2 Test inline edit row mới → save hoạt động
- [ ] 2.3 Run `npm run type-check` → pass

## 3. Commit

- [ ] 3.1 Commit với message: `fix(api): allow empty process_name when creating style thread spec`
