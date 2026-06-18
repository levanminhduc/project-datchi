#!/bin/bash
# ============================================================
# post-restore.sh — Chạy sau khi restore DB từ máy khác
# Đồng bộ lại auth.users <-> employees
#
# Cách dùng:
#   ./post-restore.sh              # Mật khẩu ROOT mặc định: Duc@1234
#   ./post-restore.sh MyP@ss123    # Tự đặt mật khẩu ROOT
# ============================================================
set -e

DB_CONTAINER="supabase-db"
DB_USER="postgres"
ROOT_PASSWORD="${1:-Duc@1234}"

# Lấy key từ .env.docker
ANON_KEY=$(grep '^ANON_KEY=' .env.docker | cut -d= -f2)
SERVICE_KEY=$(grep '^SERVICE_ROLE_KEY=' .env.docker | cut -d= -f2)

echo "========================================="
echo " POST-RESTORE: Đồng bộ auth.users"
echo "========================================="
echo ""

# ---------------------------------------------------------
# Bước 1: Xóa auth_user_id "ma" (UUID từ DB nguồn)
# ---------------------------------------------------------
echo "[1/6] Xóa auth_user_id cũ không hợp lệ..."
CLEARED=$(docker exec $DB_CONTAINER psql -U $DB_USER -t -A -c "
  WITH cleared AS (
    UPDATE public.employees
    SET auth_user_id = NULL
    WHERE auth_user_id IS NOT NULL
      AND auth_user_id NOT IN (SELECT id FROM auth.users)
    RETURNING id
  )
  SELECT count(*) FROM cleared;
")
echo "  → Đã xóa $CLEARED liên kết cũ"

# ---------------------------------------------------------
# Bước 2: Xóa auth users không còn ai liên kết
# ---------------------------------------------------------
echo "[2/6] Dọn auth users orphan..."
DELETED=$(docker exec $DB_CONTAINER psql -U $DB_USER -t -A -c "
  WITH deleted AS (
    DELETE FROM auth.users
    WHERE id NOT IN (
      SELECT auth_user_id FROM public.employees
      WHERE auth_user_id IS NOT NULL
    )
    RETURNING id
  )
  SELECT count(*) FROM deleted;
")
echo "  → Đã xóa $DELETED auth users cũ"

# ---------------------------------------------------------
# Bước 3: Tạo lại auth user cho ROOT
# ---------------------------------------------------------
echo "[3/6] Tạo auth user cho ROOT..."

ROOT_EMP_ID=$(docker exec $DB_CONTAINER psql -U $DB_USER -t -A -c "
  SELECT e.employee_id
  FROM public.employees e
  JOIN public.employee_roles er ON er.employee_id = e.id
  JOIN public.roles r ON er.role_id = r.id
  WHERE r.code = 'root'
  LIMIT 1;
")

if [ -z "$ROOT_EMP_ID" ]; then
  ROOT_EMP_ID=$(docker exec $DB_CONTAINER psql -U $DB_USER -t -A -c "
    SELECT employee_id FROM public.employees WHERE chuc_vu = 'Root' LIMIT 1;
  ")
fi

if [ -z "$ROOT_EMP_ID" ]; then
  echo "  ERROR: Không tìm thấy ROOT employee!"
  exit 1
fi

ROOT_EMAIL=$(echo "$ROOT_EMP_ID" | tr '[:upper:]' '[:lower:]')@internal.datchi.local
echo "  ROOT: $ROOT_EMP_ID → $ROOT_EMAIL"

EXISTING=$(docker exec $DB_CONTAINER psql -U $DB_USER -t -A -c "
  SELECT a.id FROM auth.users a
  JOIN public.employees e ON e.auth_user_id = a.id
  WHERE e.employee_id = '$ROOT_EMP_ID';
")

if [ -n "$EXISTING" ]; then
  echo "  → ROOT đã có auth user ($EXISTING), cập nhật mật khẩu..."
  curl -s -X PUT "http://localhost:8001/auth/v1/admin/users/$EXISTING" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"password\": \"$ROOT_PASSWORD\"}" > /dev/null
else
  RESPONSE=$(curl -s -X POST "http://localhost:8001/auth/v1/admin/users" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$ROOT_EMAIL\",
      \"password\": \"$ROOT_PASSWORD\",
      \"email_confirm\": true
    }")

  NEW_UUID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$NEW_UUID" ]; then
    echo "  ERROR: Không tạo được auth user cho ROOT!"
    echo "  Response: $RESPONSE"
    exit 1
  fi

  echo "  → Auth user mới: $NEW_UUID"
  docker exec $DB_CONTAINER psql -U $DB_USER -c "
    UPDATE public.employees
    SET auth_user_id = '$NEW_UUID'
    WHERE employee_id = '$ROOT_EMP_ID';
  " > /dev/null
fi

# ---------------------------------------------------------
# Bước 4: Tạo auth user cho TẤT CẢ nhân viên còn lại
# ---------------------------------------------------------
echo "[4/6] Tạo auth user cho tất cả nhân viên..."

BULK_CREATED=$(docker exec $DB_CONTAINER psql -U $DB_USER -t -A -c "
  DO \$\$
  DECLARE
    emp RECORD;
    new_uid uuid;
    email_addr text;
    created_count int := 0;
  BEGIN
    FOR emp IN
      SELECT id, employee_id, password_hash
      FROM public.employees
      WHERE auth_user_id IS NULL
        AND is_active = true
        AND deleted_at IS NULL
        AND password_hash IS NOT NULL
        AND password_hash != ''
    LOOP
      new_uid := gen_random_uuid();
      email_addr := lower(emp.employee_id) || '@internal.datchi.local';

      -- Bỏ qua nếu email đã tồn tại trong auth.users
      IF EXISTS (SELECT 1 FROM auth.users WHERE email = email_addr AND is_sso_user = false) THEN
        -- Liên kết employee với auth user đã có
        UPDATE public.employees
        SET auth_user_id = (SELECT id FROM auth.users WHERE email = email_addr AND is_sso_user = false LIMIT 1)
        WHERE id = emp.id;
        created_count := created_count + 1;
        CONTINUE;
      END IF;

      -- Tạo auth.users: copy bcrypt hash thẳng từ employees
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, is_sso_user, is_anonymous
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_uid,
        'authenticated',
        'authenticated',
        email_addr,
        emp.password_hash,  -- bcrypt hash giữ nguyên
        now(),
        '{\"provider\": \"email\", \"providers\": [\"email\"]}',
        '{\"email_verified\": true}',
        now(), now(), false, false
      );

      -- Tạo auth.identities (bắt buộc cho GoTrue)
      INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        new_uid::text,
        new_uid,
        jsonb_build_object(
          'sub', new_uid::text,
          'email', email_addr,
          'email_verified', false,
          'phone_verified', false
        ),
        'email',
        now(), now(), now()
      );

      -- Liên kết employee
      UPDATE public.employees
      SET auth_user_id = new_uid
      WHERE id = emp.id;

      created_count := created_count + 1;
    END LOOP;

    RAISE NOTICE 'created:%', created_count;
  END \$\$;
" 2>&1 | grep -o 'created:[0-9]*' | cut -d: -f2)

echo "  → Đã tạo auth user cho ${BULK_CREATED:-0} nhân viên"

# ---------------------------------------------------------
# Bước 5: Kiểm tra
# ---------------------------------------------------------
echo "[5/6] Kiểm tra kết quả..."
echo ""

docker exec $DB_CONTAINER psql -U $DB_USER -c "
  SELECT
    'Tổng nhân viên active' AS metric,
    count(*)::text AS value
  FROM public.employees WHERE is_active = true AND deleted_at IS NULL

  UNION ALL

  SELECT
    'Có auth user (đăng nhập được)',
    count(*)::text
  FROM public.employees e
  JOIN auth.users a ON e.auth_user_id = a.id
  WHERE e.is_active = true AND e.deleted_at IS NULL

  UNION ALL

  SELECT
    'Chưa có auth (thiếu password_hash)',
    count(*)::text
  FROM public.employees
  WHERE is_active = true
    AND deleted_at IS NULL
    AND auth_user_id IS NULL

  UNION ALL

  SELECT
    'auth_user_id lỗi (MISSING!)',
    count(*)::text
  FROM public.employees e
  LEFT JOIN auth.users a ON e.auth_user_id = a.id
  WHERE e.auth_user_id IS NOT NULL AND a.id IS NULL;
"

echo ""
echo "========================================="
echo "[6/6] Health check dịch vụ..."
echo "========================================="
echo ""

# Kiểm tra các container quan trọng
UNHEALTHY=0
for SVC in supabase-db supabase-kong supabase-auth backend datchi-frontend-1; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$SVC" 2>/dev/null || echo "not_found")
  RUNNING=$(docker inspect --format='{{.State.Status}}' "$SVC" 2>/dev/null || echo "not_found")
  if [ "$RUNNING" = "running" ] && { [ "$STATUS" = "healthy" ] || [ "$STATUS" = "" ]; }; then
    echo "  ✅ $SVC"
  elif [ "$RUNNING" = "running" ]; then
    echo "  ⚠️  $SVC ($STATUS)"
  else
    echo "  ❌ $SVC ($RUNNING)"
    UNHEALTHY=1
  fi
done

# Test login thực tế
echo ""
echo "  Kiểm tra đăng nhập ROOT..."
LOGIN_RESULT=$(curl -s -X POST "http://localhost:8001/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ROOT_EMAIL\", \"password\": \"$ROOT_PASSWORD\"}" 2>/dev/null)

if echo "$LOGIN_RESULT" | grep -q "access_token"; then
  TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  ME_RESULT=$(curl -s "http://localhost:${BACKEND_PORT:-3011}/api/auth/me" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  if echo "$ME_RESULT" | grep -q '"isRoot":true'; then
    echo "  ✅ Đăng nhập ROOT thành công"
  else
    echo "  ⚠️  Auth OK nhưng backend /me lỗi: $ME_RESULT"
    UNHEALTHY=1
  fi
else
  echo "  ❌ Đăng nhập thất bại!"
  UNHEALTHY=1
fi

echo ""
echo "========================================="
echo " HOÀN TẤT"
echo "========================================="
echo ""
echo " Đăng nhập ROOT: $ROOT_EMP_ID / $ROOT_PASSWORD"
echo " Tất cả nhân viên: dùng mật khẩu cũ (giữ nguyên)"
echo ""
if [ $UNHEALTHY -eq 1 ]; then
  echo " ⚠️  Có vấn đề cần kiểm tra (xem chi tiết ở trên)"
else
  echo " ✅ Tất cả OK — sẵn sàng sử dụng"
fi
echo "========================================="
