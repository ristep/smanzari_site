#!/bin/bash

./dump_database.sh

# Copy backups to Google Drive
rclone copy -P --drive-chunk-size 64M backups/ gdrive:backups/smanzary_site/backups/
rclone copy -P --max-depth 1 --drive-chunk-size 64M smanzy_data/uploads/ gdrive:backups/smanzary_site/uploads/

# Remove files older than 30 days
find /home/ristepan/smanzari_site/backups -type f -mtime +30 -delete
find /home/ristepan/smanzari_site/smanzy_data/uploads -type f -mtime +30 -delete
