#!/usr/bin/env bash
set -euo pipefail

HOST_DB_DIR="D:/Supabase/supabase-data/db"
HOST_STORAGE_DIR="D:/Supabase/supabase-data/storage"
DB_VOLUME="supabase_db_project-datchi"
STORAGE_VOLUME="supabase_storage_project-datchi"

echo "=== Migrate Supabase Volumes to Host Directory ==="
echo "DB:      $HOST_DB_DIR"
echo "Storage: $HOST_STORAGE_DIR"
echo ""

mkdir -p "$HOST_DB_DIR" "$HOST_STORAGE_DIR"

echo "[1/6] Backup DB volume..."
docker run --rm \
  -v "${DB_VOLUME}:/source:ro" \
  -v "${HOST_DB_DIR}:/target" \
  alpine sh -c "cp -a /source/. /target/"
echo "  DB data copied to $HOST_DB_DIR"

echo "[2/6] Backup Storage volume..."
docker run --rm \
  -v "${STORAGE_VOLUME}:/source:ro" \
  -v "${HOST_STORAGE_DIR}:/target" \
  alpine sh -c "cp -a /source/. /target/"
echo "  Storage data copied to $HOST_STORAGE_DIR"

echo ""
echo "[3/6] Stop Supabase..."
supabase stop --workdir D:/HoaThoDienBan/VueJS/project-datchi 2>/dev/null || true
echo "  Supabase stopped"

echo "[4/6] Remove old volumes..."
docker volume rm "$DB_VOLUME" 2>/dev/null || true
docker volume rm "$STORAGE_VOLUME" 2>/dev/null || true
echo "  Old volumes removed"

echo "[5/6] Create new volumes pointing to host directories..."
docker volume create --driver local \
  --opt type=none \
  --opt o=bind \
  --opt device="$HOST_DB_DIR" \
  "$DB_VOLUME"

docker volume create --driver local \
  --opt type=none \
  --opt o=bind \
  --opt device="$HOST_STORAGE_DIR" \
  "$STORAGE_VOLUME"
echo "  Volumes created with bind mount"

echo ""
echo "[6/6] Start Supabase..."
supabase start --workdir D:/HoaThoDienBan/VueJS/project-datchi
echo ""
echo "=== Migration Complete ==="
echo "Data now lives at:"
echo "  DB:      $HOST_DB_DIR"
echo "  Storage: $HOST_STORAGE_DIR"
echo ""
echo "Docker/container hỏng → data vẫn an toàn trên ổ D:"
