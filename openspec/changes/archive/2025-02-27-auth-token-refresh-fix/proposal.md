# Auth Token Refresh Fix

## Why
User gặp lỗi nghiêm trọng: sau vài tiếng không dùng app, token hết hạn → redirect login → login xong vẫn báo "Không tìm thấy nhân viên". Không thể đăng nhập lại được.

## What
Fix triệt để auth token refresh flow để:
1. Token được auto-refresh khi sắp hết hạn
2. Khi token expired, hệ thống tự refresh và retry request
3. Khi không thể refresh, redirect đến login một cách clean

## Root Cause Analysis

### Vấn đề 1: `getSession()` KHÔNG auto-refresh token
- `supabase.auth.getSession()` chỉ đọc từ localStorage, KHÔNG trigger refresh
- Cần dùng `getUser()` để validate và trigger refresh

### Vấn đề 2: `init()` logic sai
- Gọi `getSession()` → nhận token expired → gọi API fail
- `onAuthStateChange` listener setup SAU khi init() → miss events

### Vấn đề 3: Không có retry logic
- `fetchApi()` gặp 401 → throw error ngay, không thử refresh
- `fetchCurrentEmployee()` không validate token trước khi gọi API

### Vấn đề 4: Supabase client thiếu explicit config
- Không có explicit `autoRefreshToken: true`
- Không có explicit `persistSession: true`

## Impact
- **Affected files**: 4 files (supabase.ts, useAuth.ts, api.ts, authService.ts)
- **Risk**: Medium - auth là critical path nhưng changes are isolated
- **Testing**: Manual test login/logout, tab inactive, token expiry

## Capabilities
1. Explicit Supabase auth config
2. Proper init() flow với getUser()
3. 401 retry logic trong fetchApi()
4. TOKEN_REFRESHED handler refresh permissions
5. Update CLAUDE.md documentation
