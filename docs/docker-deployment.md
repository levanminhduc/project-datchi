# Docker Deployment Guide

**Project:** Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ)
**Last updated:** 2026-03-14

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
│  Docker: Frontend (nginx-brotli) — port 8080            │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Static files │  │ proxy /api │  │ proxy /supabase  │  │
│  │ (Vue SPA)   │  │  → :3000   │  │  → host:54321    │  │
│  └─────────────┘  └─────┬──────┘  └────────┬─────────┘  │
└──────────────────────────┼─────────────────┼────────────┘
                           │                 │
              ┌────────────▼──────┐  ┌───────▼─────────┐
              │ Docker: Backend   │  │ Supabase CLI     │
              │ (Hono) — port 3010│  │ (chạy riêng)    │
              │ server.mjs bundle │  │ port 54321       │
              └───────────────────┘  └──────────────────┘
```

**Chỉ build 2 containers** (Frontend + Backend). Supabase chạy bằng `supabase start` — không Docker riêng.

---

## Cấu trúc files Docker

```
project-datchi/
├── docker-compose.yml          # 2 services: frontend + backend
├── Dockerfile.frontend         # 3-stage: deps → builder → production (nginx-brotli)
├── Dockerfile.backend          # 3-stage: builder → deps → production (esbuild bundle)
├── nginx.docker.conf           # Docker config: brotli + gzip + security headers + proxies
├── nginx.conf                  # Dev config (Vite dev server)
├── .env.docker                 # Env cho Docker — KHÔNG commit
└── .dockerignore               # Loại bỏ node_modules, dist, .env...
```

---

## Lệnh chạy

### Khởi động

```bash
# 1. Đảm bảo Supabase CLI đang chạy
supabase start

# 2. Build & start Docker (FE + BE)
docker compose --env-file .env.docker up --build -d
```

### Rebuild sau khi thay đổi code

```bash
# Rebuild tất cả
docker compose --env-file .env.docker up --build -d

# Chỉ rebuild backend (nhanh hơn)
docker compose --env-file .env.docker up --build -d backend

# Chỉ rebuild frontend
docker compose --env-file .env.docker up --build -d frontend
```

### Dừng / Xóa

```bash
# Dừng
docker compose --env-file .env.docker down

# Xóa kể cả volumes
docker compose --env-file .env.docker down -v
```

### Kiểm tra health

```bash
docker compose --env-file .env.docker ps
# STATUS column: "healthy" hoặc "unhealthy"
```

---

## URLs & Ports

| Service | URL | Ghi chú |
|---------|-----|---------|
| Frontend | `http://<IP>:8080` | Vue SPA qua nginx |
| Backend API | `http://<IP>:8080/api/` | Proxy qua nginx → Hono |
| Supabase API | `http://<IP>:8080/supabase/` | Proxy qua nginx → Supabase CLI |
| Backend trực tiếp | `http://<IP>:3010` | Không qua nginx |

**IP nào cũng vào được** — PC, điện thoại, tablet trong cùng mạng LAN.

---

## Dev Local vs Docker

| | Dev local | Docker |
|---|---|---|
| Frontend | `npm run dev` → port 5173 | nginx → port 8080 |
| Backend | `tsx server/index.ts` → port 3000 | Node container → port 3010 |
| Supabase | `supabase start` → port 54321 | Dùng chung Supabase CLI |
| Env file | `.env` | `.env.docker` |
| Supabase URL | `http://127.0.0.1:54321` | `/supabase` (proxy qua nginx) |
| Truy cập LAN | Không (localhost only) | Có (IP nào cũng được) |

Cả 2 chế độ **chạy song song được** — không conflict ports.

---

## Image Optimization

### Kết quả

| Image | Size (optimized) | Kỹ thuật |
|-------|-----------------|---------|
| Frontend | 47.6 MB | nginx-brotli, 3-stage, selective COPY |
| Backend | 555 MB | esbuild bundle, 3-stage, npm omit=dev |

### Frontend (3 stages: deps → builder → production)

- **Stage 1 `deps`:** `node:22-alpine`, `npm install` (không `npm ci` — xem Known Issue #1)
- **Stage 2 `builder`:** Selective COPY (`index.html`, `src/`, `public/`, config files) — không `COPY . .`
- **Stage 3 `production`:** `alpine:3.20` + nginx + brotli + gzip compression
- HEALTHCHECK: `curl -f http://localhost:80/` (interval 30s, start 5s)
- Non-root user: `nginx`
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, etc.

### Backend (3 stages: builder → deps → production)

- **Stage 1 `builder`:** `npm ci` + esbuild bundle → 1 file `server.mjs` (minify, tree-shaking, ~301KB)
- **Stage 2 `deps`:** `npm ci --omit=dev` (chỉ production dependencies)
- **Stage 3 `production`:** `node:22-alpine`, non-root user `nodejs`
- HEALTHCHECK: `wget -qO- http://localhost:3000/health` (interval 30s, start 10s)
- npm cache mount (`--mount=type=cache`) cho builder và deps stages

---

## Cấu hình chi tiết

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
      VITE_SUPABASE_URL: http://host.docker.internal:54321
      VITE_SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY}
      SUPABASE_JWT_SECRET: ${JWT_SECRET}
```

### nginx.docker.conf — Key sections

```nginx
# Proxy backend
location /api/ {
    proxy_pass http://backend:3000;
}

# Proxy Supabase (giải quyết truy cập từ devices khác)
location /supabase/ {
    proxy_pass http://host.docker.internal:54321/;
}

# SPA fallback
location / {
    try_files $uri $uri/ /index.html;
}
```

### src/lib/supabase.ts — Auto-resolve URL

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'

// Docker mode: "/supabase" → resolve thành full URL từ browser origin
const resolvedSupabaseUrl = supabaseUrl.startsWith('/')
  ? `${window.location.origin}${supabaseUrl}`
  : supabaseUrl
```

Khi `VITE_SUPABASE_URL=/supabase`:
- PC truy cập `http://localhost:8080` → `http://localhost:8080/supabase`
- Điện thoại `http://192.168.1.5:8080` → `http://192.168.1.5:8080/supabase`

---

## Known Issues & Fixes

### 1. Rollup native binary mismatch

**Lỗi:** `Cannot find module @rollup/rollup-linux-x64-musl`

**Nguyên nhân:** `npm ci` dùng `package-lock.json` từ Windows (x64-win), container là Alpine Linux (x64-musl).

**Fix:** Dùng `npm install` thay vì `npm ci` trong frontend Dockerfile, không copy `package-lock.json`.

```dockerfile
# ❌ Sai
COPY package.json package-lock.json ./
RUN npm ci

# ✅ Đúng
COPY package.json ./
RUN npm install
```

### 2. Sai env var prefix cho backend

**Vấn đề:** Backend container dùng `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` — prefix `VITE_` là convention của Vite (frontend-only), không phải backend.

**Tác động:** Functional — code server đọc được — nhưng misleading về ownership.

**Trạng thái:** Technical debt — chưa fix để tránh break changes. Nên đổi thành `SUPABASE_URL` và `SUPABASE_ANON_KEY` trong tương lai.

### 3. "Failed to fetch" trên điện thoại

**Lỗi:** Login từ điện thoại → `Failed to fetch`.

**Nguyên nhân:** `VITE_SUPABASE_URL=http://localhost:54321` bake lúc build — `localhost` trên điện thoại = chính điện thoại.

**Fix:** nginx proxy `/supabase/` → host Supabase, frontend dùng relative URL `/supabase` resolve bằng `window.location.origin` lúc runtime.

### 4. Port conflicts với dev server

**Vấn đề:** Port 3000 (backend dev) và 5432 (Postgres local) có thể conflict.

**Fix:** Docker dùng ports khác — Frontend: 8080, Backend: 3010, Postgres: 5433.

### 5. Postgres internal port

**Lỗi:** Auth service không connect được DB, `connection refused` trên port 5432.

**Nguyên nhân:** `PGPORT=${POSTGRES_PORT}` truyền vào container khiến Postgres listen trên port khác bên trong container.

**Fix:** Hardcode internal port = 5432, chỉ đổi host mapping.

---

## HEALTHCHECK

| Container | Command | Interval | Start period |
|-----------|---------|----------|--------------|
| Frontend | `curl -f http://localhost:80/` | 30s | 5s |
| Backend | `wget -qO- http://localhost:3000/health` | 30s | 10s |

---

## Bảo mật

Files chứa secrets đã add vào `.gitignore`:

```
.env
.env.local
.env.production
.env.docker
.env.*.local
```

**KHÔNG BAO GIỜ commit** các file này.

---

## Rollback

```bash
# Tag image hiện tại trước khi deploy mới (làm trước khi build)
docker tag project-datchi-frontend:latest project-datchi-frontend:backup
docker tag project-datchi-backend:latest project-datchi-backend:backup

# Nếu build mới lỗi — dừng containers
docker compose --env-file .env.docker down

# Option 1: rollback từ git commit cũ
git checkout <commit-hash>
docker compose --env-file .env.docker up --build -d

# Option 2: chạy image backup trực tiếp
docker run -d -p 8080:80 project-datchi-frontend:backup
docker run -d -p 3010:3000 project-datchi-backend:backup
```
