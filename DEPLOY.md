# Deploy, Backup & Chuyển máy — Đất Chỉ

Tài liệu cho người vận hành máy chủ (prod). Máy chủ **không cần source code**, chỉ cần Docker, PostgreSQL và một thư mục deploy. Mọi lệnh bên dưới chạy bằng **PowerShell** (5.1 hoặc 7 đều được).

## 1. Kiến trúc

```
Trình duyệt ──► frontend (nginx, :8080) ──/api──► backend (Hono, 127.0.0.1:3010)
                                                     │            │
                                   DATABASE_URL ─────┘            └── /data/storage (trong container)
                                         │                                  │ bind mount
                                         ▼                                  ▼
                              PostgreSQL 17 trên máy host        Thư mục .\storage trên máy host
```

| Thành phần | Nằm ở đâu | Backup bằng |
|---|---|---|
| Image `datchi-frontend`, `datchi-backend` | `ghcr.io/levanminhduc/...` (public) | Không cần, pull lại được |
| Dữ liệu (bài viết, tồn kho, user…) | PostgreSQL trên host, DB `datchi` | `pg_dump` |
| **Ảnh bài hướng dẫn** | Thư mục `STORAGE_HOST_DIR` (mặc định `.\storage`) | **Copy nguyên thư mục** |
| Cấu hình | `.env.docker` | Copy file (có secret, giữ kín) |

> DB chỉ lưu đường dẫn ảnh (`/api/guides/images/guides/<file>.webp`), file ảnh nằm trong thư mục storage.
> **Backup hoặc chuyển máy luôn phải mang theo cả DB lẫn thư mục storage.** Thiếu thư mục storage thì ảnh vỡ.
> File ảnh không bao giờ bị xóa khi sửa/xóa bài, nên thư mục storage mới nhất dùng được với mọi bản backup DB cũ hơn.

Cấu trúc thư mục deploy:

```
D:\datchi\
├── docker-compose.ghcr.yml
├── .env.docker
├── migrations-applied.txt              ← nhật ký migration đã chạy (mục 3)
├── storage\guide-images\guides\*.webp   ← ảnh bài hướng dẫn
└── backups\                             ← file backup
```

> **Quy ước:** mọi lệnh `docker compose` đều phải có `-f docker-compose.ghcr.yml --env-file .env.docker`.
> Thiếu `--env-file` thì compose coi `DATABASE_URL`, `JWT_SIGNING_SECRET` là rỗng (cảnh báo `variable is not set`). Nếu lỡ chạy `up` như vậy, backend sẽ không kết nối được DB.
> Để gõ ngắn, đặt biến một lần cho mỗi cửa sổ PowerShell:
> ```powershell
> function dc { docker compose -f docker-compose.ghcr.yml --env-file .env.docker @args }
> ```
> Sau đó dùng `dc ps`, `dc logs backend`, `dc up -d`…

## 2. Deploy máy mới

### 2.1 Chuẩn bị
- Docker Desktop (Windows) hoặc Docker Engine + Compose v2.
- PostgreSQL 17, có `psql`, `pg_dump`, `pg_restore` trong PATH (`C:\Program Files\PostgreSQL\17\bin`).
- Image đang để public nên **không cần** `docker login`. Nếu sau này chuyển sang private: tạo GitHub PAT (classic) quyền `read:packages` rồi chạy `docker login ghcr.io -u <GITHUB_USERNAME>` và dán PAT làm mật khẩu.

### 2.2 Lấy file cấu hình

```powershell
New-Item -ItemType Directory -Force D:\datchi\storage, D:\datchi\backups | Out-Null
cd D:\datchi
$raw = "https://raw.githubusercontent.com/levanminhduc/project-datchi/main"
curl.exe -fsSL "$raw/docker-compose.ghcr.yml" -o docker-compose.ghcr.yml
curl.exe -fsSL "$raw/.env.docker.example" -o .env.docker
New-Item -ItemType File -Force migrations-applied.txt | Out-Null
```

Sửa `.env.docker` bằng Notepad:

| Biến | Giá trị |
|---|---|
| `FRONTEND_PORT` / `BACKEND_PORT` | Mặc định `8080` / `3010`, đổi nếu trùng port |
| `FRONTEND_URL` | URL người dùng mở app, ví dụ `http://192.168.1.10:8080`. Dùng cho CORS, phải khớp chính xác |
| `DATABASE_URL` | `postgresql://<user>:<pass>@host.docker.internal:5432/datchi`. Giữ `host.docker.internal`, **không** dùng `localhost` |
| `JWT_SIGNING_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự. **Giữ nguyên khi chuyển máy/cập nhật** để user không bị đăng xuất |
| `STORAGE_DIR` | Giữ nguyên `/data/storage` |
| `STORAGE_HOST_DIR` | Thư mục ảnh trên host, mặc định `./storage` (tính từ thư mục chứa file compose) |
| `IMAGE_TAG` | Bỏ trống = `latest`, hoặc pin một version, ví dụ `1.2.0` |
| `TELEGRAM_*`, `CHATBOT_*` | Tùy chọn. **Không dùng thì xóa giá trị mẫu, để trống** |

Tạo secret ngẫu nhiên:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2.3 Chuẩn bị PostgreSQL

Container kết nối tới PostgreSQL trên host qua `host.docker.internal`, nên:
- `postgresql.conf`: `listen_addresses = '*'`
- `pg_hba.conf`: thêm dòng cho phép container kết nối, ví dụ `host datchi all 0.0.0.0/0 scram-sha-256`. Dòng này mở cho mọi IP, **chỉ dùng khi máy nằm trong mạng nội bộ tin cậy và firewall Windows chặn port 5432 từ ngoài**. Siết lại dải IP nếu biết dải của Docker.
- Restart dịch vụ `postgresql-x64-17` sau khi sửa.

Tạo DB và extension:

```powershell
$env:PGPASSWORD = "<mật khẩu postgres>"
createdb -h 127.0.0.1 -U postgres datchi
psql -h 127.0.0.1 -U postgres -d datchi -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS unaccent;'
```

Nạp dữ liệu từ máy đang chạy: làm theo [mục 4](#4-chuyển-sang-máy-khác--restore).

### 2.4 Chạy

```powershell
cd D:\datchi
docker compose -f docker-compose.ghcr.yml --env-file .env.docker pull
docker compose -f docker-compose.ghcr.yml --env-file .env.docker up -d
```

### 2.5 Kiểm tra sau deploy

```powershell
docker compose -f docker-compose.ghcr.yml --env-file .env.docker ps     # backend, frontend: Up ... (healthy)
curl.exe http://127.0.0.1:3010/health                                   # {"status":"ok",...}
curl.exe http://127.0.0.1:8080/health                                   # qua nginx, cũng phải {"status":"ok"}
docker compose -f docker-compose.ghcr.yml --env-file .env.docker logs --tail 30 backend
```

Log backend bình thường có các dòng:

```
PostgreSQL pool initialized for: postgresql://...@host.docker.internal:5432/datchi
CORS enabled for: http://<FRONTEND_URL>
Server is running at http://localhost:3000
[realtime] LISTEN datchi_realtime established
```

Checklist trên trình duyệt (`http://<ip-máy-chủ>:8080`):
- [ ] Đăng nhập được.
- [ ] Mở trang tồn kho, số liệu hiển thị.
- [ ] Mở một bài hướng dẫn có ảnh: ảnh hiện.
- [ ] Tạo bài nháp, thêm 1 ảnh, lưu: file mới xuất hiện trong `D:\datchi\storage\guide-images\guides\`. Xóa bài nháp đó sau khi test.

## 3. Cập nhật version mới

1. **Backup trước** (lệnh ở [mục 4](#4-chuyển-sang-máy-khác--restore), phần "máy cũ").
2. **Chạy migration DB mới (nếu có).** Image **không** tự chạy migration, và DB không có bảng ghi lại migration đã chạy, nên phải tự quản bằng `migrations-applied.txt`.
   - Bên dev gửi kèm mỗi bản phát hành danh sách file migration mới. Lấy danh sách bằng:
     `git diff --name-only <tag-cũ> <tag-mới> -- supabase/migrations`
   - Trên máy chủ, với từng file **theo thứ tự tên** (tên file bắt đầu bằng timestamp) và chưa có trong `migrations-applied.txt`:
     ```powershell
     cd D:\datchi
     $env:PGPASSWORD = "<mật khẩu postgres>"
     $raw = "https://raw.githubusercontent.com/levanminhduc/project-datchi/main"
     $f = "20260924120000_quota_demand_parse_calculation_cones.sql"
     curl.exe -fsSL "$raw/supabase/migrations/$f" -o "backups\$f"
     psql -h 127.0.0.1 -U postgres -d datchi -v ON_ERROR_STOP=1 -f "backups\$f"
     if ($LASTEXITCODE -eq 0) { Add-Content migrations-applied.txt $f } else { "LỖI - dừng lại, báo dev" }
     ```
     Gặp lỗi thì **dừng, không deploy image mới**, gửi dev nội dung lỗi và tên file. Không chạy lại file đã ghi trong `migrations-applied.txt`.
3. **Pull và khởi động lại:**
   ```powershell
   docker compose -f docker-compose.ghcr.yml --env-file .env.docker pull
   docker compose -f docker-compose.ghcr.yml --env-file .env.docker up -d
   docker image prune -f
   ```
4. Làm lại checklist [2.5](#25-kiểm-tra-sau-deploy).

**Rollback image:** đặt `IMAGE_TAG=<tag cũ>` trong `.env.docker` (version như `1.2.0` hoặc 7 ký tự commit SHA; xem danh sách tag tại `https://github.com/levanminhduc/project-datchi/pkgs/container/datchi-backend`), rồi `up -d` lại. Migration DB không tự rollback. Nếu migration làm hỏng dữ liệu thì restore bản backup ở bước 1.

## 4. Chuyển sang máy khác / restore

Trên **máy cũ** (cũng là lệnh backup trước mỗi lần cập nhật):

```powershell
cd D:\datchi
$env:PGPASSWORD = "<mật khẩu postgres>"
$ts = Get-Date -Format yyyyMMdd_HHmmss
pg_dump -h 127.0.0.1 -U postgres -d datchi -Fc --no-owner --no-privileges --schema=public -f "backups\db_$ts.dump"
Compress-Archive -Path storage\* -DestinationPath "backups\storage_$ts.zip"
```

Copy sang **máy mới**: `backups\db_<ts>.dump`, `backups\storage_<ts>.zip`, `.env.docker`, `docker-compose.ghcr.yml`, `migrations-applied.txt`.

Trên **máy mới** (đã làm xong mục 2.1 → 2.3, **chưa** chạy `up`):

```powershell
cd D:\datchi
$env:PGPASSWORD = "<mật khẩu postgres>"
pg_restore -h 127.0.0.1 -U postgres -d datchi --no-owner --disable-triggers backups\db_<ts>.dump
Expand-Archive backups\storage_<ts>.zip -DestinationPath storage -Force
dir storage\guide-images\guides | Select-Object -First 5      # phải thấy file .webp
docker compose -f docker-compose.ghcr.yml --env-file .env.docker up -d
```

> `pg_restore` in ra `ERROR: schema "public" already exists` và `errors ignored on restore: 1` là **bình thường** (DB mới đã có sẵn schema `public`). Lỗi khác dòng này mới cần xử lý.

Có thể copy thẳng thư mục `storage` (USB, robocopy, share mạng) thay vì zip, miễn giữ đúng cấu trúc `storage\guide-images\guides\<file>.webp`.

Kiểm tra dữ liệu sau khi restore:

```powershell
# Số dòng các bảng chính — so với máy cũ phải giống nhau
psql -h 127.0.0.1 -U postgres -d datchi -tAc "SELECT (SELECT count(*) FROM thread_inventory), (SELECT count(*) FROM employees), (SELECT count(*) FROM guides)"

# Ảnh DB tham chiếu mà thiếu file (không in ra gì = đủ ảnh)
psql -h 127.0.0.1 -U postgres -d datchi -tAc "SELECT DISTINCT m[1] FROM guides g, regexp_matches(g.content_html, '/api/guides/images/(guides/[^\""'' ]+)', 'g') m WHERE g.deleted_at IS NULL" |
  Where-Object { $_ -and -not (Test-Path "storage\guide-images\$_") }
```

## 5. Backup định kỳ

Chạy lệnh backup ở mục 4 ("máy cũ") theo lịch bằng Task Scheduler, ví dụ mỗi đêm. Giữ ít nhất 7 bản gần nhất và copy ra ổ hoặc máy khác. Backup phải có **cả** file `db_*.dump` lẫn `storage_*.zip` của cùng thời điểm.

Trên máy dev có source (Git Bash) có sẵn script tương đương:

| Lệnh | Việc |
|---|---|
| `bash scripts/db-backup.sh` | Dump DB → `backups/db_<ts>.dump` |
| `npm run backup:storage` | Nén thư mục ảnh (`STORAGE_HOST_DIR`, mặc định `./storage`) → `backups/storage_<ts>.tar.gz` |
| `npm run backup:full` | Cả 2 → `backups/full_<ts>.tar.gz` |
| `npm run restore:full -- <file>` | Restore DB (ghi đè schema `public`) + bổ sung ảnh |

## 6. Nâng cấp máy đang chạy bản cũ

### 6.1 Máy đang chạy bản PostgreSQL, ảnh trong named volume `guide_storage`

Bản compose trước lưu ảnh trong Docker named volume. Bản mới dùng thư mục `.\storage`. **Phải copy ảnh ra trước khi thay file compose**, nếu không ảnh sẽ vỡ:

```powershell
cd D:\datchi
$cid = docker compose -f docker-compose.ghcr.yml --env-file .env.docker ps -q backend   # container bản cũ còn đang chạy
New-Item -ItemType Directory -Force storage | Out-Null
docker cp "${cid}:/data/storage/." .\storage\
(dir storage\guide-images\guides | Measure-Object).Count                                # số ảnh đã copy
```

Sau đó:
1. Tải `docker-compose.ghcr.yml` bản mới (lệnh ở 2.2).
2. Thêm dòng `STORAGE_HOST_DIR=./storage` vào `.env.docker`.
3. `pull` + `up -d` như mục 3.

Volume cũ vẫn giữ nguyên làm dự phòng (`docker volume ls`). Chỉ xóa khi đã chắc chắn ảnh hiện đủ.

### 6.2 Máy vẫn đang chạy bản Supabase

Không nâng cấp thẳng được. Phải chuyển dữ liệu Supabase sang PostgreSQL thuần và lấy ảnh ra từ Supabase Storage trước. Liên hệ dev để làm theo quy trình migration riêng.

## 7. Phát hành bản mới (phía dev)

Workflow `.github/workflows/docker-publish.yml`: 2 job song song build `Dockerfile.backend` và `Dockerfile.frontend`, rồi push lên GHCR bằng `GITHUB_TOKEN`.

| Trigger | Tag image |
|---|---|
| Push `main` | `latest` + `<sha 7 ký tự>` |
| Push tag `v1.2.3` | `1.2.3` + `1.2` + `<sha>` |
| Actions → *Build & Push Docker Images* → Run workflow | Như push branch được chọn |

Checklist trước khi báo prod cập nhật:
- [ ] Code đã **push** lên `origin/main`. CI chỉ build những gì có trên GitHub, commit chỉ nằm ở máy local sẽ không có trong image.
- [ ] Run mới nhất ở tab Actions màu xanh, và thời gian build khớp commit vừa push (`gh run list --workflow docker-publish.yml -L 3`).
- [ ] Không commit file `.env` hoặc secret (repo đang **public**).
- [ ] Gửi prod: tag/version và danh sách file migration mới (mục 3).

Cấu hình GitHub:
- Settings → Actions → General → Workflow permissions: **Read and write**.
- Secret `VITE_API_URL`: **để trống hoặc không tạo**. Frontend gọi đường dẫn tương đối `/api/...` qua nginx; đặt `/api` sẽ thành `/api/api/...`.
- Các secret `VITE_SUPABASE_*`, `SUPABASE_*` không còn dùng, có thể xóa.

## 8. Xử lý sự cố

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| Cảnh báo `The "DATABASE_URL" variable is not set` | Thiếu `--env-file .env.docker` trong lệnh compose |
| `unauthorized` / `denied` khi pull | Image đã chuyển private: `docker login ghcr.io` với PAT quyền `read:packages` |
| Backend restart liên tục, log lỗi kết nối DB | Sai `DATABASE_URL`; PostgreSQL chưa `listen_addresses='*'`, `pg_hba.conf` chặn, hoặc dịch vụ PostgreSQL chưa chạy |
| Ảnh bài hướng dẫn vỡ (404) | Thiếu file trong `storage\guide-images\guides\`: copy lại từ backup; kiểm tra `STORAGE_HOST_DIR` trỏ đúng thư mục |
| Upload ảnh báo "Lỗi khi tải ảnh lên" | Thư mục storage không ghi được; xem log backend dòng `STORAGE_DIR is not usable` |
| Đăng nhập xong bị đá ra / 401 hàng loạt | `JWT_SIGNING_SECRET` đã đổi: user đăng nhập lại. Giữ nguyên secret khi chuyển máy |
| Frontend báo lỗi CORS | `FRONTEND_URL` không khớp URL đang mở app (cả `http`/`https`, IP/tên miền, port) |
| App chạy nhưng thiếu tính năng mới / lỗi SQL "column does not exist" | Chưa chạy migration mới (mục 3) hoặc image `latest` chưa được build lại (mục 7) |
| Port đã dùng | Đổi `FRONTEND_PORT` / `BACKEND_PORT` |
