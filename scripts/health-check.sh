#!/bin/bash

# ============================================
# Smanzy Health Check Script
# ============================================

echo "=== Smanzy Health Check ==="
echo ""

# Check container status
echo "Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "smanzy|NAMES" || echo "No smanzy containers running"

echo ""
echo "Health Status:"

POSTGRES_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' smanzy_postgres 2>/dev/null || echo "not running")
BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' smanzy_backend 2>/dev/null || echo "not running")
FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' smanzy_frontend 2>/dev/null || echo "not running")

echo "  PostgreSQL: $POSTGRES_HEALTH"
echo "  Backend:    $BACKEND_HEALTH"
echo "  Frontend:   $FRONTEND_HEALTH"

echo ""
echo "Endpoint Checks:"

# Check backend health endpoint
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "  Backend /health:  OK"
else
    echo "  Backend /health:  FAIL"
fi

# Check frontend
if curl -sf http://localhost:80/ > /dev/null 2>&1; then
    echo "  Frontend /:       OK"
else
    echo "  Frontend /:       FAIL"
fi

echo ""
echo "=== Health Check Complete ==="
