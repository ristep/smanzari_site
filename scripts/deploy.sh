#!/bin/bash
set -euo pipefail

# ============================================
# Smanzy Production Deployment Script
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"

echo "=== Smanzy Deployment Script ==="
echo "Project: $PROJECT_DIR"
echo "Compose: $COMPOSE_FILE"
echo ""

# Pre-flight checks
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "ERROR: .env file not found at $PROJECT_DIR/.env"
    exit 1
fi

# Step 1: Backup current images (for rollback)
echo "[1/5] Backing up current images..."
docker tag smanzy_backend:latest smanzy_backend:$BACKUP_TAG 2>/dev/null || echo "No existing backend image"
docker tag smanzy_frontend:latest smanzy_frontend:$BACKUP_TAG 2>/dev/null || echo "No existing frontend image"
echo "Backup tag: $BACKUP_TAG"

# Step 2: Build new images
echo "[2/5] Building new images..."
docker compose -f "$COMPOSE_FILE" build --no-cache

# Step 3: Stop old containers gracefully
echo "[3/5] Stopping old containers..."
docker compose -f "$COMPOSE_FILE" stop backend frontend || true

# Step 4: Start new containers
echo "[4/5] Starting new containers..."
docker compose -f "$COMPOSE_FILE" up -d

# Step 5: Health check
echo "[5/5] Running health checks..."
sleep 10

BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' smanzy_backend 2>/dev/null || echo "unknown")
FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' smanzy_frontend 2>/dev/null || echo "unknown")
POSTGRES_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' smanzy_postgres 2>/dev/null || echo "unknown")

echo ""
echo "=== Health Status ==="
echo "PostgreSQL: $POSTGRES_HEALTH"
echo "Backend:    $BACKEND_HEALTH"
echo "Frontend:   $FRONTEND_HEALTH"

if [ "$BACKEND_HEALTH" != "healthy" ] || [ "$FRONTEND_HEALTH" != "healthy" ]; then
    echo ""
    echo "WARNING: Not all services are healthy yet."
    echo "Run './scripts/health-check.sh' to monitor status."
    echo "Run './scripts/rollback.sh $BACKUP_TAG' to rollback if needed."
fi

echo ""
echo "=== Deployment Complete ==="
echo "Backup tag for rollback: $BACKUP_TAG"
