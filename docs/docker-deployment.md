# Đất Chỉ — Hướng dẫn Docker Deployment

> Tài liệu ghi lại từ phiên làm việc setup Docker cho dự án.

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│  Browser (PC / Điện thoại / Tablet)                     │
│  http://<any-ip>:8080                                   │
└──────────┬──────────────┬───────────────┬───────────────┘
           │              │               │
       /index.html    /api/*        /supabase/*
           │              │               │
┌──────────▼──────────────▼───────────────▼───────────────┐
│  Docker: Frontend (nginx) — port 8080                   │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Static files │  │ proxy /api │  │ proxy /supabase  │  │
│  │ (Vue SPA)   │  │  → :3000   │  │  → host:54321    │  │
│  └─────────────┘  └─────┬──────┘  └────────┬─────────┘  │
└──────────────────────────┼─────────────────┼────────────┘
                           │                 │
              ┌────────────▼──────┐  ┌───────▼─────────┐
              │ Docker: Backend   │  │ Supabase CLI     │
              │ (Hono) — port 3010│  │ (đang chạy sẵn) │
              │                   │  │ port 54321       │
              │ connect Supabase  │  └──────────────────┘
              │ qua host:54321    │
              └───────────────────┘
```

**Chỉ build 2 containers** (Frontend + Backend). Supabase chạy sẵn bằng `supabase start`, không cần Docker riêng.

---

## Lệnh chạy

### Khởi động

```bash
# 1. Đảm bảo Supabase CLI đang chạy
supabase start

# 2. Build & start Docker (FE + BE)
docker compose --env-file .env.docker up --build -d
```

### Rebuild sau khi code tính năng mới

```bash
# Rebuild tất cả
docker compose --env-file .env.docker up --build -d

# Chỉ rebuild backend (nhanh hơn)
docker compose --env-file .env.docker up --build -d backend

# Chỉ rebuild frontend
docker compose --env-file .env.docker up --build -d frontend
```

### Dừng

```bash
docker compose --env-file .env.docker down
```

### Xóa sạch (kể cả volumes)

```bash
docker compose --env-file .env.docker down -v
```

---

## URLs truy cập

| Service | URL | Ghi chú |
|---------|-----|---------|
| Frontend | `http://<IP>:8080` | Vue SPA qua nginx |
| Backend API | `http://<IP>:8080/api/` | Proxy qua nginx → Hono |
| Supabase API | `http://<IP>:8080/supabase/` | Proxy qua nginx → Supabase CLI |
| Backend trực tiếp | `http://<IP>:3010` | Không qua nginx |

> **IP nào cũng vào được** — PC, điện thoại, tablet trong cùng mạng LAN.

---

## Cấu trúc files Docker

```
project-datchi/
├── docker-compose.yml          # Chỉ 2 services: frontend + backend
├── Dockerfile.frontend         # Multi-stage: node build → nginx serve
├── Dockerfile.backend          # Node + tsx chạy server/index.ts
├── nginx.conf                  # Proxy /api/ + /supabase/ + SPA fallback
├── .env.docker                 # Env cho Docker (KHÔNG commit lên git)
├── .env                        # Env cho dev local (KHÔNG commit lên git)
└── .dockerignore               # Loại bỏ node_modules, dist, .env...
```

---

## File cấu hình chi tiết

### docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_URL: ${VITE_API_URL:-}
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-/supabase}
        VITE_SUPABASE_ANON_KEY: ${ANON_KEY}
    ports:
      - "${FRONTEND_PORT:-8080}:80"
    extra_hosts:
      - "host.docker.internal:host-gateway"

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "${BACKEND_PORT:-3010}:3000"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      PORT: 3000
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:8080}
      NEXT_PUBLIC_SUPABASE_URL: http://host.docker.internal:54321
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY}
      SUPABASE_JWT_SECRET: ${JWT_SECRET}
```

### nginx.conf — Điểm quan trọng

```nginx
# Proxy backend
location /api/ {
    proxy_pass http://backend:3000;
}

# Proxy Supabase (giải quyết vấn đề truy cập từ thiết bị khác)
location /supabase/ {
    proxy_pass http://host.docker.internal:54321/;
}

# SPA fallback
location / {
    try_files $uri $uri/ /index.html;
}
```

### supabase.ts — Auto-resolve URL

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'

// Docker mode: "/supabase" → resolve thành full URL từ browser origin
const resolvedSupabaseUrl = supabaseUrl.startsWith('/')
  ? `${window.location.origin}${supabaseUrl}`
  : supabaseUrl
```

Khi `VITE_SUPABASE_URL=/supabase`:
- PC truy cập `http://localhost:8080` → Supabase URL = `http://localhost:8080/supabase`
- Điện thoại truy cập `http://192.168.1.5:8080` → Supabase URL = `http://192.168.1.5:8080/supabase`

---

## Các lỗi đã gặp và cách fix

### 1. Rollup native binary mismatch

**Lỗi:** `Cannot find module @rollup/rollup-linux-x64-musl`

**Nguyên nhân:** `npm ci` dùng `package-lock.json` từ Windows (x64-win), container là Alpine Linux (x64-musl).

**Fix:** Dùng `npm install` thay vì `npm ci`, không copy `package-lock.json` vào container.

```dockerfile
# Sai
COPY package.json package-lock.json ./
RUN npm ci

# Đúng
COPY package.json ./
RUN npm install
```

### 2. Postgres internal port bị đổi

**Lỗi:** Auth service không connect được DB, `connection refused` trên port 5432.

**Nguyên nhân:** `PGPORT=${POSTGRES_PORT}` truyền vào container khiến Postgres listen trên port khác (5433) bên trong container. Các service khác connect `db:5432` → fail.

**Fix:** Hardcode internal port = 5432, chỉ đổi host mapping.

```yaml
# Sai
PGPORT: ${POSTGRES_PORT:-5432}  # Nếu POSTGRES_PORT=5433 → Postgres listen 5433

# Đúng
PGPORT: 5432  # Luôn listen 5432 bên trong container
```

### 3. Kong `eval echo` mất double quotes

**Lỗi:** `in '_format_version': expected a string`

**Nguyên nhân:** `eval "echo \"$(cat ~/temp.yml)\""` — shell eval nuốt mất double quotes trong YAML, `"2.1"` thành `2.1` (không phải string).

**Fix:** Dùng `perl` thay thế env vars, giữ nguyên YAML format.

```yaml
entrypoint: >
  bash -c "perl -pe 's/\\$$([A-Z_]+)/$$ENV{$$1}/g' ~/temp.yml > ~/kong.yml && /docker-entrypoint.sh kong docker-start"
```

### 4. "Failed to fetch" trên điện thoại

**Lỗi:** Login từ điện thoại → `Failed to fetch`.

**Nguyên nhân:** `VITE_SUPABASE_URL=http://localhost:54321` bake lúc build. `localhost` trên điện thoại = chính điện thoại → không có Supabase.

**Fix:** Nginx proxy `/supabase/` → host Supabase, frontend dùng relative URL `/supabase` resolve bằng `window.location.origin` lúc runtime. IP nào cũng vào được.

### 5. Port conflicts với dev server

**Lỗi:** Port 3000 (backend dev) và 5432 (Postgres local) đã bị chiếm.

**Fix:** Docker dùng ports khác: Frontend=8080, Backend=3010, Postgres=5433.

---

## Bảo mật

Các file chứa secrets đã được thêm vào `.gitignore`:

```gitignore
.env
.env.local
.env.production
.env.docker
.env.*.local
```

**KHÔNG BAO GIỜ commit** các file này lên git.

---

## Chế độ Dev local vs Docker

| | Dev local | Docker |
|---|---|---|
| Frontend | `npm run dev` → port 5173 | nginx → port 8080 |
| Backend | `npx tsx server/index.ts` → port 3000 | Node container → port 3010 |
| Supabase | `supabase start` → port 54321 | Dùng chung Supabase CLI |
| Env file | `.env` | `.env.docker` |
| Supabase URL | `http://127.0.0.1:54321` | `/supabase` (proxy qua nginx) |
| Truy cập LAN | Không (localhost only) | Có (IP nào cũng được) |

Cả 2 chế độ **chạy song song được**, không conflict ports.
