# Backend Security Review - 2026-02-21

## Tổng quan
- Phạm vi review: `server/` (Hono routes, middleware auth, Supabase client usage).
- Kết luận nhanh: Backend hiện tại **chưa an toàn** để expose trên network vì nhiều endpoint quan trọng đang mở công khai và đang dùng `supabaseAdmin` (service_role, bypass RLS).

## Số liệu tóm tắt
- Tổng số route files: `25`
- Route files có `authMiddleware`: `3`
- Route files không có `authMiddleware`: `22`
- Số write endpoints (POST/PUT/PATCH/DELETE) trong nhóm chưa auth: `99`

## Findings (ưu tiên theo mức độ nghiêm trọng)

### C01 - Missing authentication cho đa số endpoint (Critical)
- Mô tả: Nhiều API CRUD và nghiệp vụ kho chưa gắn `authMiddleware`, cho phép gọi trực tiếp không cần token.
- Bằng chứng:
  - Mount route domain: `server/index.ts:58`, `server/index.ts:60`, `server/index.ts:62`, `server/index.ts:68`, `server/index.ts:79`, `server/index.ts:80`
  - Write endpoints không auth (ví dụ):
    - `server/routes/employees.ts:312`
    - `server/routes/employees.ts:373`
    - `server/routes/employees.ts:452`
    - `server/routes/allocations.ts:429`
    - `server/routes/allocations.ts:1577`
    - `server/routes/stock.ts:215`
    - `server/routes/stock.ts:325`
    - `server/routes/weeklyOrder.ts:647`
    - `server/routes/weeklyOrder.ts:847`
- Tác động: Toàn bộ dữ liệu có thể bị đọc/sửa/xóa trái phép.
- Khuyến nghị:
  - Mặc định auth cho `/api/*`, chỉ whitelist explicit cho endpoint public (`/api/auth/login`, `/api/auth/refresh`).
  - Thêm `requirePermission(...)` theo domain và theo action.

### C02 - Dùng `supabaseAdmin` trên nhiều route không auth (Critical)
- Mô tả: Route import service-role client (`supabaseAdmin`) trên nhiều module nghiệp vụ.
- Bằng chứng:
  - Ví dụ import: `server/routes/employees.ts:2`, `server/routes/allocations.ts:2`, `server/routes/inventory.ts:2`, `server/routes/weeklyOrder.ts:3`
  - DB client: `server/db/supabase.ts` (service role bypass RLS)
- Tác động: Nếu endpoint bị gọi được thì RLS không còn tác dụng bảo vệ.
- Khuyến nghị:
  - Chuyển route thông thường sang `supabase` (anon + RLS).
  - Chỉ dùng `supabaseAdmin` cho tác vụ admin/backend internal đã auth + authorize rất chặt.

### C03 - Privilege escalation qua write operations không bảo vệ (Critical)
- Mô tả: Nhiều thao tác thay đổi tồn kho/xuất kho/phân bổ không có auth.
- Bằng chứng:
  - `server/routes/allocations.ts:531`
  - `server/routes/allocations.ts:955`
  - `server/routes/allocations.ts:1076`
  - `server/routes/stock.ts:471`
  - `server/routes/weeklyOrder.ts:921`
- Tác động: Có thể tạo biến động tồn kho giả, sai lệch số liệu vận hành.
- Khuyến nghị:
  - Bắt buộc auth + permission theo quy trình (approve/issue/cancel/receive).

### H01 - Lộ thông tin nhạy cảm tại endpoint nhân sự (High)
- Mô tả: `GET /api/employees/:id` trả về thông tin bảo mật tài khoản.
- Bằng chứng:
  - Route public: `server/routes/employees.ts:260`
  - Fields nhạy cảm: `server/routes/employees.ts:281` (`failed_login_attempts`, `locked_until`, `must_change_password`, `last_login_at`)
- Tác động: Rò rỉ trạng thái bảo mật, hỗ trợ attacker reconnaissance.
- Khuyến nghị:
  - Yêu cầu auth + permission cho endpoint chi tiết nhân viên.
  - Tách response an toàn (không trả về field bảo mật cho role thường).

### H02 - Settings read đang public (High)
- Mô tả: `GET /api/settings` và `GET /api/settings/:key` đang không auth.
- Bằng chứng:
  - `server/routes/settings.ts:17`
  - `server/routes/settings.ts:56`
- Tác động: Lộ cấu hình hệ thống và metadata nội bộ.
- Khuyến nghị:
  - Bắt buộc auth cho settings read.
  - Giới hạn theo role (admin/root) cho key nhạy cảm.

### H03 - Settings write phân quyền quá rộng (High)
- Mô tả: `PUT /api/settings/:key` chỉ cần login; chỉ 1 key (`employee_detail_fields`) mới bắt buộc ROOT.
- Bằng chứng:
  - `server/routes/settings.ts:117`
  - `server/routes/settings.ts:119`
  - `server/routes/settings.ts:120`
- Tác động: User thường có thể đổi cấu hình nghiệp vụ quan trọng.
- Khuyến nghị:
  - Áp `requireAdmin` (tối thiểu) cho toàn bộ settings write.
  - Định nghĩa danh sách key theo policy role (admin-only, root-only).

### H04 - Mật khẩu reset mặc định yếu (High)
- Mô tả: Nếu không gửi `newPassword`, hệ thống dùng default `Password123!`.
- Bằng chứng:
  - `server/routes/auth.ts:513`
  - `server/routes/auth.ts:530`
- Tác động: Tăng nguy cơ đăng nhập trái phép nếu admin reset mà không đặt password mới.
- Khuyến nghị:
  - Bỏ fallback password mặc định.
  - Bắt buộc random temp password + expiry ngắn + bắt buộc đổi ngay.

### H05 - Chính sách ROOT-only không nhất quán (High)
- Mô tả: Comment route ghi "ROOT only" cho role update, nhưng code chỉ `requireAdmin` và cho admin sửa role thường.
- Bằng chứng:
  - Comment: `server/routes/auth.ts:1036`
  - Route guard: `server/routes/auth.ts:1038`
  - Chỉ chặn một số trường hợp khi không root: `server/routes/auth.ts:1055`
- Tác động: Dùng sai kỳ vọng policy, dễ phát sinh lỗi phân quyền.
- Khuyến nghị:
  - Chốt lại policy và enforce đúng với comment/tài liệu.
  - Nếu ROOT-only thì check `authContext.isRoot` ngay đầu route.

### M01 - Chưa có rate limiting cho login/refresh (Medium)
- Mô tả: Endpoint auth public chưa có giới hạn tần suất theo IP/device/account.
- Bằng chứng:
  - `server/routes/auth.ts:32`
  - `server/routes/auth.ts:231`
- Tác động: Tăng nguy cơ brute force và abuse tài nguyên.
- Khuyến nghị:
  - Thêm middleware rate limit (IP + account key).
  - Bổ sung delay/backoff theo số lần thất bại.

### M02 - Refresh token chưa được rotation one-time-use (Medium)
- Mô tả: `/refresh` cấp access token mới nhưng không cấp refresh token mới và không rotate token cũ.
- Bằng chứng:
  - Verify refresh: `server/routes/auth.ts:240`
  - Chỉ sign access token: `server/routes/auth.ts:300`
- Tác động: Nếu refresh token bị lộ, attacker có thể dùng đến hết hạn.
- Khuyến nghị:
  - Implement refresh token rotation (rotate + revoke token cũ).
  - Gắn session id/jti và phát hiện reuse token.

### M03 - Có khả năng account enumeration qua message login (Medium)
- Mô tả: Login trả thông điệp khác nhau cho từng trạng thái tài khoản.
- Bằng chứng:
  - Sai thông tin đăng nhập: `server/routes/auth.ts:71`
  - Tài khoản bị khóa: `server/routes/auth.ts:85`
  - Tài khoản bị vô hiệu: `server/routes/auth.ts:97`
  - Chưa đặt mật khẩu: `server/routes/auth.ts:108`
- Tác động: Attacker đoán được tình trạng account.
- Khuyến nghị:
  - Thông điệp public đồng nhất.
  - Log chi tiết ở server-side.

### M04 - JWT hardening chưa đầy đủ (Medium)
- Mô tả: `jwt.verify` chưa khóa algorithm/audience/issuer.
- Bằng chứng:
  - `server/middleware/auth.ts:34`
  - `server/routes/auth.ts:240`
- Tác động: Giảm độ chặt chẽ của token validation.
- Khuyến nghị:
  - Truyền options verify rõ ràng: `algorithms`, `issuer`, `audience`.
  - Kiểm soát key rotation và token version.

### M05 - Query filter sử dụng nối chuỗi trực tiếp (Medium)
- Mô tả: Giá trị user input được nối vào chuỗi `.or(...)` của PostgREST filter.
- Bằng chứng:
  - `server/routes/employees.ts:155`
  - `server/routes/employees.ts:208`
  - `server/routes/auth.ts:1219`
- Tác động: Có thể gây parser injection/filter bypass hoặc query behavior bất ngờ.
- Khuyến nghị:
  - Escape/filter ký tự đặc biệt trước khi đưa vào chuỗi filter.
  - Hạn chế search pattern và chiều dài input.

### M06 - Validation input chưa đồng bộ giữa các route (Medium)
- Mô tả: Nhiều route dùng `await c.req.json()` + check thủ công, chưa schema validation nhất quán.
- Bằng chứng:
  - `server/routes/auth.ts:33`
  - `server/routes/auth.ts:232`
  - `server/routes/auth.ts:1041`
- Tác động: Dễ sót case input xấu, không đồng bộ lỗi 400.
- Khuyến nghị:
  - Chuẩn hóa zod/valibot cho body/query/params toàn bộ route.
  - Tự động hóa response validation error theo format chung.

### M07 - Thiếu security headers hardening (Medium)
- Mô tả: Chỉ thấy CORS middleware, chưa thấy security headers middleware.
- Bằng chứng:
  - `server/index.ts:41`
- Tác động: Tăng bề mặt tấn công client-side (MIME sniff, framing, etc.).
- Khuyến nghị:
  - Thêm middleware `secureHeaders` (hoặc tương đương) và CSP phù hợp.

### L01 - Secret env chưa fail-fast ở startup (Low)
- Mô tả: `JWT_SECRET` dùng non-null assertion nhưng không validate startup.
- Bằng chứng:
  - `server/middleware/auth.ts:8`
  - `server/routes/auth.ts:16`
- Tác động: Sai env có thể gây lỗi runtime hoặc config không an toàn.
- Khuyến nghị:
  - Validate env ngay khi app boot, fail-fast nếu thiếu secret quan trọng.

### L02 - Contract API response chưa nhất quán (Low)
- Mô tả: Một số endpoint auth trả `{ success, error, message }`, endpoint khác theo `{ data, error }`.
- Bằng chứng:
  - Convention trong project yêu cầu `{ data, error, message? }`.
  - Ví dụ response `success` style: `server/routes/auth.ts:760`, `server/routes/auth.ts:823`, `server/routes/auth.ts:893`
- Tác động: Frontend xử lý lỗi phức tạp hơn, dễ sai logic.
- Khuyến nghị:
  - Chuẩn hóa response shape trên toàn bộ backend.

## Danh sách route files chưa gắn authMiddleware
- `server/routes/allocations.ts`
- `server/routes/batch.ts`
- `server/routes/colors.ts`
- `server/routes/dashboard.ts`
- `server/routes/employees.ts`
- `server/routes/inventory.ts`
- `server/routes/issuesV2.ts`
- `server/routes/lots.ts`
- `server/routes/positions.ts`
- `server/routes/purchaseOrders.ts`
- `server/routes/reconciliation.ts`
- `server/routes/recovery.ts`
- `server/routes/reports.ts`
- `server/routes/stock.ts`
- `server/routes/styles.ts`
- `server/routes/styleThreadSpecs.ts`
- `server/routes/suppliers.ts`
- `server/routes/thread-type-supplier.ts`
- `server/routes/threadCalculation.ts`
- `server/routes/threads.ts`
- `server/routes/warehouses.ts`
- `server/routes/weeklyOrder.ts`

## Kế hoạch khắc phục đề xuất (ưu tiên cao đến thấp)
1. Áp global auth cho `/api/*`, whitelist endpoint public.
2. Chốt ma trận permission theo domain/action và gắn middleware phân quyền.
3. Chuyển route không cần service-role sang `supabase` + RLS policy.
4. Hardening auth flow: rate limit, refresh rotation, thông điệp login đồng nhất, JWT verify options.
5. Chuẩn hóa validation schema và response contract.
6. Thêm security headers và env validation fail-fast.
