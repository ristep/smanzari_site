#!/bin/bash

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_BACKUP_DIR="$SCRIPT_DIR/backups/db"
UPLOADS_DIR="$SCRIPT_DIR/smanzy_data/uploads"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="$DB_BACKUP_DIR/smanzy_db_$TIMESTAMP.sql.gz"
ENV_FILE="$SCRIPT_DIR/.env"
CONTAINER_NAME="smanzy_postgres"

# Create backup directory if it doesn't exist
mkdir -p "$DB_BACKUP_DIR"

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
echo "Target:    $DB_BACKUP_FILE"

# Run pg_dump inside the container and compress the output
if docker exec -e PGPASSWORD="$DB_PASS" "$CONTAINER_NAME" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$DB_BACKUP_FILE"; then

    echo "Success: Backup completed."

    # Create/Update 'latest' symlink
    ln -sf "$DB_BACKUP_FILE" "$DB_BACKUP_DIR/latest.sql.gz"

    # Calculate size
    SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    echo "Backup size: $SIZE"

    # Prune backups older than 30 days
    echo "Cleaning up backups older than 30 days..."
    find "$DB_BACKUP_DIR" -name "smanzy_db_*.sql.gz" -mtime +30 -delete

    echo "db backup process finished ---> $TIMESTAMP"
else
    echo "db backup failed!"
    exit 1
fi


# rsclone to google drive
echo "--- Starting Google Drive Backup ---"
echo "Timestamp: $TIMESTAMP"
echo "Database:  $DB_NAME"
echo "Target:    $DB_BACKUP_FILE"   
echo "Target:    $UPLOADS_DIR"

rclone copy -P --drive-chunk-size 64M "$DB_BACKUP_DIR" gdrive:backups/smanzary_site/backups/
rclone copy -P --drive-chunk-size 64M "$UPLOADS_DIR" gdrive:backups/smanzary_site/uploads/

echo "backup process finished ---> $TIMESTAMP"