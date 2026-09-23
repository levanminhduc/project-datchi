# Thiết kế: Giữ đăng nhập bền vững (sliding session, chống race, sống qua reboot)

- **Ngày:** 2026-06-18
- **Branch:** spec-ade/migration-postgresql
- **Trạng thái:** Đã duyệt design, chờ viết implementation plan

## 1. Bối cảnh & Vấn đề

Sau khi bỏ Supabase và chuyển sang PostgreSQL thuần, nhân viên bị bắt đăng nhập lại vào ngày hôm sau,
trong khi trước đây (dùng Supabase GoTrue) phiên được giữ qua nhiều ngày.

**Nguyên nhân gốc** (xác định từ dữ liệu thực tế trong bảng `auth_refresh_tokens`, nhân viên id=17,
mốc 2026-06-17 14:53:04):

1. **Race condition ở `POST /api/auth/refresh`** (`server/routes/auth.ts`): handler `SELECT` kiểm tra
   `revoked_at` rồi mới `UPDATE` revoke — không có transaction/lock. Hai request refresh đồng thời
   cùng một refresh token đều vượt qua bước kiểm tra "chưa revoke", cùng tạo token con
   (bằng chứng: hai token con `6468ed89` và `1c8b278b` sinh ra từ cùng cha `bc537f63` cách nhau 5ms,
   rồi bị revoke đồng loạt). Request kế dùng token đã xoay → kích hoạt nhánh reuse-detection
   → **mass-revoke toàn bộ token của nhân viên** → phiên chết.
2. **Refresh token TTL cố định 7 ngày, không gia hạn** (`JWT_REFRESH_TTL_SECONDS=604800`).
3. **Không có khoảng ân hạn tái sử dụng** (reuse grace) như Supabase GoTrue → bất kỳ lần dùng lại token
   vừa xoay nào cũng giết phiên ngay, kể cả tình huống đa-tab / retry mạng hợp lệ.

Token JWT là stateless (không kiểm DB) nên access token còn hạn vẫn dùng được tới khi hết hạn (~1h);
nhân viên tắt máy, hôm sau access token đã hết hạn và refresh token đã bị revoke từ hôm trước
→ `/refresh` trả 401 → bắt đăng nhập lại.

## 2. Yêu cầu (đã chốt với người dùng)

- **R1 — Giữ đăng nhập vô thời hạn khi còn dùng đều** (sliding refresh, như Facebook). Vào làm mỗi ngày
  thì không bao giờ phải đăng nhập lại.
- **R2 — Sống sót qua server reset:** restart tiến trình Node (`npm run dev:all`, `pm2 restart`, deploy)
  và reboot cả máy chủ (PostgreSQL bật lại, data trên đĩa còn nguyên) đều không làm mất phiên.
- **R3 — Buộc đăng xuất khi:** (a) đổi/reset mật khẩu, (b) tài khoản bị khóa/xóa,
  (c) nghỉ dùng quá 90 ngày (idle), (d) nhân viên tự bấm "Đăng xuất mọi thiết bị".
- **R4 — Hỗ trợ nhiều thiết bị** (vì có nút logout-all-devices).

## 3. Phạm vi (Scope)

**Trong phạm vi:**
- Sliding refresh token 90 ngày.
- Sửa race ở `/refresh` (atomic CAS + transaction + ân hạn tái sử dụng).
- Revoke token khi tự đổi mật khẩu.
- Endpoint + nút "Đăng xuất mọi thiết bị".
- Bảo đảm bất biến giúp sống qua reboot (secret cố định, fail-fast).

**Ngoài phạm vi (YAGNI):**
- Danh sách "thiết bị đang đăng nhập" (cần thêm cột user-agent/IP — làm spec riêng nếu cần sau).
- Chuyển sang session cookie httpOnly.
- Đổi thuật toán ký token.
- Thay đổi schema bảng `auth_refresh_tokens` (cột hiện tại đã đủ).

## 4. Hướng tiếp cận đã chọn: Vá tại chỗ mô hình hiện có (Hướng A)

Giữ kiến trúc access JWT (HS256, 1h) + refresh token (lưu hash SHA-256 trong `auth_refresh_tokens`),
chỉ sửa các điểm giòn. Lý do: sửa đúng nguyên nhân gốc, tái dùng tối đa code đang chạy thật,
ít rủi ro nhất. (Hướng B "refresh token tĩnh" và Hướng C "cookie httpOnly" đã cân nhắc và loại.)

## 5. Thiết kế chi tiết

### 5.1. Mô hình token & vòng đời

| Token | TTL | Ghi chú |
|-------|-----|---------|
| Access JWT (HS256) | 1 giờ (`JWT_ACCESS_TTL_SECONDS=3600`) | Giữ nguyên. Stateless. |
| Refresh token (hash trong DB) | **90 ngày, sliding** (`JWT_REFRESH_TTL_SECONDS=7776000`) | Đổi từ 7 ngày; gia hạn mỗi lần refresh. |

**Sliding:** mỗi lần `/refresh` thành công, token mới cấp với `expires_at = now() + 90 ngày`.
Dùng đều → hạn luôn bị đẩy lùi → không bao giờ phải đăng nhập lại (R1). Nghỉ >90 ngày liên tục
→ refresh token hết hạn tự nhiên → bắt đăng nhập lại (R3c).

### 5.2. Refresh flow chống race (root cause fix)

Thay logic "SELECT kiểm tra rồi UPDATE" hiện tại bằng 2 lớp, toàn bộ chạy trong một transaction
(`BEGIN/COMMIT` trên một client lấy từ pool):

**Lớp 1 — Atomic claim (compare-and-swap):** giành quyền xoay token bằng một câu UPDATE nguyên tử:

```sql
UPDATE auth_refresh_tokens
SET revoked_at = now()
WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
RETURNING id, employee_id;
```

- Trả về 1 dòng → request này "thắng", được phép cấp token con mới (rotate) + access token mới.
- Trả về 0 dòng → token không tồn tại / đã revoke / đã hết hạn → sang Lớp 2 (KHÔNG mass-revoke ngay).

**Lớp 2 — Ân hạn tái sử dụng (reuse grace, 30 giây):** khi Lớp 1 trả 0 dòng, kiểm tra xem token này
có vừa bị xoay hợp lệ gần đây không — tức có token con (`rotated_from = <id token này>`) được tạo
trong vòng 30 giây và **chưa bị revoke**:

```sql
SELECT id FROM auth_refresh_tokens
WHERE rotated_from = (SELECT id FROM auth_refresh_tokens WHERE token_hash = $1)
  AND revoked_at IS NULL
  AND created_at > now() - interval '30 seconds'
ORDER BY created_at DESC
LIMIT 1;
```

- **Có** → request trùng lặp hợp lệ (đa-tab / retry mạng / scheduler + handler 401 chạy cùng lúc)
  → trả lại token con đó + access token mới tương ứng. **Không giết phiên.**
- **Không** (token con cũng đã revoke, hoặc đã quá 30s) → dấu hiệu replay/đánh cắp token thật sự
  → mass-revoke toàn bộ token của nhân viên + trả 401, bắt đăng nhập lại.

> Lưu ý triển khai: cần lấy lại refresh token thô của token con để trả về client. Vì DB chỉ lưu hash,
> phương án: trong cùng transaction khi tạo token con (ở Lớp 1 của request thắng), không thể lấy lại
> token thô từ request thua. Do đó request thua (Lớp 2) sẽ trả về theo một trong hai cách — chốt khi
> viết plan: (a) trả 409/202 báo client "đang refresh, dùng token hiện có và thử lại sau", hoặc
> (b) chấp nhận cấp một access token mới dựa trên token con đang hợp lệ mà không xoay thêm.
> Quyết định kỹ thuật này thuộc giai đoạn implementation plan.

**Phụ trợ frontend (đã có, kiểm lại — không phải chỗ dựa chính):** singleton `refreshPromise` +
`BroadcastChannel` trong `src/services/api.ts` giảm số request refresh trùng. Nguyên tắc:
**server phải bền vững bất kể client làm gì.**

### 5.3. Thu hồi session & đa thiết bị

| Sự kiện | Hành vi | Trạng thái |
|---------|---------|-----------|
| Đổi mật khẩu (tự đổi) | Revoke toàn bộ refresh token của nhân viên | **Bổ sung** |
| Reset mật khẩu (admin) | Revoke toàn bộ | Đã có (`auth.ts`) |
| Khóa tài khoản (`is_active=false`) | Phiên chết ở lần refresh kế | Đã có |
| Xóa mềm (`deleted_at`) | Phiên chết ở lần refresh kế | Đã có |
| Idle > 90 ngày | Refresh token hết hạn tự nhiên | Có sau khi đổi TTL (5.1) |
| Nút "Đăng xuất mọi thiết bị" | Nhân viên tự revoke toàn bộ token của mình | **Thêm mới** |

**Bổ sung — revoke khi tự đổi mật khẩu:** thêm vào cuối handler `change-password`:

```sql
UPDATE auth_refresh_tokens SET revoked_at = now()
WHERE employee_id = $1 AND revoked_at IS NULL;
```

**Thêm mới — endpoint logout mọi thiết bị:** `POST /api/auth/logout-all-devices` (sau `authMiddleware`,
lấy `employee_id` từ context):

```sql
UPDATE auth_refresh_tokens SET revoked_at = now()
WHERE employee_id = $1 AND revoked_at IS NULL;
```

Frontend: nút trong trang tài khoản/profile, dùng `useConfirm()` (convention dự án), gọi qua `fetchApi()`.

### 5.4. Sống sót qua server reset (R2)

Không cần code mới, chỉ bảo đảm 2 bất biến + ghi thành guard rules:

1. **`JWT_SIGNING_SECRET` cố định**, đọc từ `.env`, không bao giờ random lúc boot.
   `server/auth/jwt.ts` đã throw khi thiếu secret — giữ và ghi rõ là **fail-fast** (server không khởi
   động được nếu thiếu secret) để tránh tình huống mỗi lần restart sinh key khác làm chết toàn bộ token.
2. **Refresh token nằm trong PostgreSQL trên đĩa** (đã đúng). Tuyệt đối không seed/migration nào
   `TRUNCATE`/`DELETE` bảng `auth_refresh_tokens` (theo rule "never delete data" của dự án).

Với 2 bất biến này: restart Node, `pm2 restart`, reboot máy đều không mất phiên. Access token còn hạn
vẫn verify được (secret không đổi); access token hết hạn thì refresh token trong DB cấp lại token mới.

### 5.5. Xử lý lỗi & UX

| Tình huống | Hành vi |
|------------|---------|
| Refresh token hợp lệ, access hết hạn | Tự refresh ngầm, người dùng không thấy gì |
| Refresh đồng thời (đa-tab) | Ân hạn 30s (5.2) — không đá ra |
| Refresh token hết hạn (idle >90 ngày) | Xóa token local → `/login` + "Phiên đã hết hạn, vui lòng đăng nhập lại" |
| Token bị thu hồi (đổi mật khẩu nơi khác / replay thật) | `/login`, thông báo rõ ràng |
| Mất mạng / backend chưa lên | **Giữ phiên**, không đá ra; hiện "Đang thử kết nối lại" |

Phân biệt rõ **401 do hết phiên** (đá về login) vs **lỗi mạng/backend** (giữ phiên + retry). Logic này
đã có trong `useAuth.ts` / `api.ts` — giữ nguyên, đảm bảo không phá vỡ khi sửa. Tất cả thông báo
người dùng bằng Tiếng Việt.

## 6. Chiến lược kiểm thử

**Chống race (quan trọng nhất — tái hiện lỗi 14:53):**
- N request `/refresh` đồng thời cùng một refresh token → tất cả thành công nhờ ân hạn 30s,
  không mass-revoke, nhân viên còn ≥1 token hợp lệ.
- Replay sau 30s: dùng lại token đã xoay quá ân hạn → mass-revoke + 401.
- Atomic CAS: 2 request song song → đúng 1 request thắng tạo token con mới.

**Sliding & idle:**
- Refresh nhiều lần → `expires_at` luôn đẩy lùi +90 ngày.
- Token `expires_at` quá khứ → bị từ chối (mô phỏng idle >90 ngày).

**Thu hồi:**
- Đổi mật khẩu → toàn bộ token bị revoke.
- `logout-all-devices` → toàn bộ token của nhân viên bị revoke; nhân viên khác không ảnh hưởng.
- `is_active=false` → refresh bị chặn.

**Sống sót reboot (thủ công/E2E):**
- Login → restart server → reload trang → vẫn đăng nhập.
- Thiếu `JWT_SIGNING_SECRET` → server fail-fast.

**Công cụ:** Playwright (đã có) cho E2E login/giữ phiên; logic refresh ưu tiên test tích hợp gọi thẳng
route Hono + DB local.

## 7. Phạm vi thay đổi (file dự kiến)

| File | Thay đổi |
|------|----------|
| `server/auth/jwt.ts` | TTL refresh 90 ngày; xác nhận fail-fast khi thiếu secret |
| `server/routes/auth.ts` | Viết lại `/refresh` (atomic CAS + transaction + ân hạn 30s); revoke token trong `change-password`; thêm route `logout-all-devices` |
| `.env`, `.env.example` | `JWT_REFRESH_TTL_SECONDS=7776000` |
| `src/composables/useAuth.ts`, `src/services/api.ts` | Kiểm lại, không phá logic giữ/đá phiên; thêm gọi `logout-all-devices` |
| Trang profile/tài khoản (frontend) | Nút "Đăng xuất mọi thiết bị" + `useConfirm()` |
| `supabase/migrations/` | **Không cần** đổi schema (bảng `auth_refresh_tokens` đã đủ cột) |

## 8. Rủi ro & Giảm thiểu

- **Rủi ro:** TTL 90 ngày + sliding làm token sống rất lâu nếu bị lộ. **Giảm thiểu:** rotation +
  reuse-detection phát hiện replay; nút logout-all-devices; revoke khi đổi mật khẩu.
- **Rủi ro:** request "thua" ở Lớp 2 cần trả token thô nhưng DB chỉ lưu hash. **Giảm thiểu:** chốt
  phương án trả về (409/retry hoặc cấp access token theo token con) ở giai đoạn implementation plan.
- **Rủi ro:** sửa `/refresh` phá vỡ luồng giữ/đá phiên frontend. **Giảm thiểu:** giữ nguyên phân loại
  lỗi 401-vs-network ở client; test E2E login + reload + reboot.

