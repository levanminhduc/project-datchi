#!/bin/bash
############################################################
# DatChi - Update & Deploy script
# Usage: ./update.sh
#
# Tự động:
#   1. Pull latest images từ GHCR
#   2. Scan & patch TẤT CẢ JS files chứa localhost:3000
#   3. Fix anon key nếu cần
#   4. Update docker-compose volume mounts
#   5. Deploy (files đã patch trước khi serve → không bị cache lỗi)
#
# Compatible: Linux, macOS, Windows Git Bash / MSYS2
############################################################
set -e

cd "$(dirname "$0")"

# Prevent Git Bash (MSYS) from converting /unix/paths to C:\windows\paths
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

COMPOSE="docker compose -f docker-compose.ghcr.yml --env-file .env.docker"
IMAGE="ghcr.io/levanminhduc/datchi-frontend:${IMAGE_TAG:-latest}"
ASSETS_DIR="/usr/share/nginx/html/assets"

echo "=== 1. Pull latest images ==="
docker compose -f docker-compose.ghcr.yml pull

echo ""
echo "=== 2. Scan & patch frontend JS ==="

TEMP_CONTAINER=$(docker create "$IMAGE")

# --- Find ALL JS files that contain localhost:3000 ---
# Use sh -c inside container to avoid Git Bash path mangling
echo "Scanning for localhost:3000 in image..."
PATCH_FILES=$(docker run --rm "$IMAGE" sh -c "grep -rl 'localhost:3000' $ASSETS_DIR/ 2>/dev/null | xargs -I{} basename {}" || true)

# --- Find api-*.js for anon key fix ---
API_JS=$(docker run --rm "$IMAGE" sh -c "ls $ASSETS_DIR/ | grep '^api-' | head -1" || true)

# --- Extract & patch files ---
MOUNT_LINES=""
PATCHED_FILES=""

# Patch localhost:3000 in all affected files
if [ -n "$PATCH_FILES" ]; then
    echo "Files to patch (localhost:3000):"
    for f in $PATCH_FILES; do
        docker cp "$TEMP_CONTAINER:$ASSETS_DIR/$f" "./$f"
        sed -i 's|http://localhost:3000||g' "./$f"
        echo "  ✓ $f"
        PATCHED_FILES="$PATCHED_FILES $f"
        MOUNT_LINES="$MOUNT_LINES\n      - ./$f:$ASSETS_DIR/$f:ro"
    done
else
    echo "  No files need localhost:3000 patch ✓"
fi

# Patch anon key in api-*.js
if [ -n "$API_JS" ]; then
    NEW_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"

    # Extract if not already extracted
    if [ ! -f "./$API_JS" ]; then
        docker cp "$TEMP_CONTAINER:$ASSETS_DIR/$API_JS" "./$API_JS"
    fi

    OLD_KEY=$(grep -oE 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' "./$API_JS" | sort -u | head -1)
    if [ -n "$OLD_KEY" ] && [ "$OLD_KEY" != "$NEW_KEY" ]; then
        echo "  Replacing anon key in $API_JS..."
        sed -i "s|$OLD_KEY|$NEW_KEY|g" "./$API_JS"
        echo "  ✓ Anon key replaced"

        # Only mount if we actually changed the file
        if ! echo "$PATCHED_FILES" | grep -q "$API_JS"; then
            MOUNT_LINES="$MOUNT_LINES\n      - ./$API_JS:$ASSETS_DIR/$API_JS:ro"
            PATCHED_FILES="$PATCHED_FILES $API_JS"
        fi
    else
        echo "  Anon key already correct ✓"
        # Clean up extracted file if no changes needed
        if ! echo "$PATCHED_FILES" | grep -q "$API_JS"; then
            rm -f "./$API_JS"
        fi
    fi
fi

docker rm "$TEMP_CONTAINER" >/dev/null

echo ""
echo "=== 3. Update docker-compose mounts ==="

# Remove ALL old JS mount lines (any .js volume mount under assets)
sed -i '/\.js:\/usr\/share\/nginx\/html\/assets\//d' docker-compose.ghcr.yml

# Add new mount lines after nginx.conf line
if [ -n "$MOUNT_LINES" ]; then
    # Use a temp file approach for reliable multi-line insert
    NGINX_LINE=$(grep -n "nginx.conf:/etc/nginx" docker-compose.ghcr.yml | head -1 | cut -d: -f1)
    if [ -n "$NGINX_LINE" ]; then
        head -n "$NGINX_LINE" docker-compose.ghcr.yml > docker-compose.ghcr.yml.tmp
        echo -e "$MOUNT_LINES" >> docker-compose.ghcr.yml.tmp
        tail -n +$((NGINX_LINE + 1)) docker-compose.ghcr.yml >> docker-compose.ghcr.yml.tmp
        mv docker-compose.ghcr.yml.tmp docker-compose.ghcr.yml
    fi
fi

# Show mounts
echo "Volume mounts:"
grep "\.js:" docker-compose.ghcr.yml | sed 's/^/  /' || echo "  (none)"

# Clean old JS files (keep only current patched files)
for old in *.js; do
    [ -f "$old" ] || continue
    if ! echo "$PATCHED_FILES" | grep -q "$old"; then
        rm -f "$old"
        echo "  Cleaned old file: $old"
    fi
done

echo ""
echo "=== 4. Deploy ==="
$COMPOSE up -d --force-recreate

echo ""
echo "=== 5. Verify ==="
sleep 3
docker ps --filter "name=backend" --filter "name=frontend" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

# Double-check: no localhost:3000 in served files (use sh -c to avoid path mangling)
echo ""
echo "=== 6. Final check ==="
REMAINING=$(docker exec datchi-frontend-1 sh -c "grep -rl 'localhost:3000' $ASSETS_DIR/ 2>/dev/null | wc -l")
if [ "$REMAINING" -eq 0 ]; then
    echo "✓ No localhost:3000 in any served JS files"
else
    echo "⚠ WARNING: $REMAINING files still contain localhost:3000!"
    docker exec datchi-frontend-1 sh -c "grep -rl 'localhost:3000' $ASSETS_DIR/ 2>/dev/null"
fi

echo ""
echo "Done! Frontend: http://localhost:${FRONTEND_PORT:-8081}"
