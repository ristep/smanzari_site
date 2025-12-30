#!/bin/bash
set -euo pipefail

# ============================================
# Smanzy Rollback Script
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

BACKUP_TAG="${1:-}"

if [ -z "$BACKUP_TAG" ]; then
    echo "Usage: $0 <backup-tag>"
    echo ""
    echo "Available backup tags:"
    docker images --format "{{.Repository}}:{{.Tag}}" | grep "backup-" || echo "No backups found"
    exit 1
fi

echo "=== Smanzy Rollback Script ==="
echo "Rolling back to: $BACKUP_TAG"
echo ""

# Step 1: Stop current containers
echo "[1/3] Stopping current containers..."
docker compose -f "$COMPOSE_FILE" stop backend frontend

# Step 2: Restore backup images
echo "[2/3] Restoring backup images..."
docker tag smanzy_backend:$BACKUP_TAG smanzy_backend:latest
docker tag smanzy_frontend:$BACKUP_TAG smanzy_frontend:latest

# Step 3: Start containers with restored images
echo "[3/3] Starting containers with restored images..."
docker compose -f "$COMPOSE_FILE" up -d backend frontend

echo ""
echo "=== Rollback Complete ==="
echo "Rolled back to: $BACKUP_TAG"
echo ""
echo "Run './scripts/health-check.sh' to verify services."
