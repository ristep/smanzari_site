#!/bin/bash

# ==============================================================================
# Database Backup Script for Smanzy Site
# ==============================================================================
# This script creates a compressed PostgreSQL dump from the Docker container.
# Backups are stored in the 'backups/db' directory with a timestamp.
# ==============================================================================

# Exit on error
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups/db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/smanzy_db_$TIMESTAMP.sql.gz"
ENV_FILE="$SCRIPT_DIR/.env"
CONTAINER_NAME="smanzy_postgres"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Load essential variables from .env
if [ -f "$ENV_FILE" ]; then
    # Parse POSTGRES_ vars specifically
    DB_USER=$(grep "^POSTGRES_USER=" "$ENV_FILE" | cut -d'=' -f2-)
    DB_PASS=$(grep "^POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2-)
    DB_NAME=$(grep "^POSTGRES_DB=" "$ENV_FILE" | cut -d'=' -f2-)
else
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container $CONTAINER_NAME is not running."
    exit 1
fi

echo "--- Starting Database Backup ---"
echo "Timestamp: $TIMESTAMP"
echo "Database:  $DB_NAME"
echo "Target:    $BACKUP_FILE"

# Run pg_dump inside the container and compress the output
if docker exec -e PGPASSWORD="$DB_PASS" "$CONTAINER_NAME" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"; then

    echo "Success: Backup completed."

    # Create/Update 'latest' symlink
    ln -sf "$BACKUP_FILE" "$BACKUP_DIR/latest.sql.gz"

    # Calculate size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $SIZE"

    # Prune backups older than 30 days
    echo "Cleaning up backups older than 30 days..."
    find "$BACKUP_DIR" -name "smanzy_db_*.sql.gz" -mtime +30 -delete

    echo "--- Backup Process Finished ---"
else
    echo "Error: Database backup failed!"
    exit 1
fi
