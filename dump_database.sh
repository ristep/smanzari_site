#!/bin/bash

# Database dump script for smanzy_postgres
# Usage: ./dump_database.sh

echo "Dumping smanzy_postgres database to DataBase.sql..."

# You'll need to provide the PostgreSQL password when prompted
pg_dump -h localhost -p 5432 -U postgres -d smanzy_postgres > DataBase.sql

if [ $? -eq 0 ]; then
    echo "Database dump completed successfully: DataBase.sql"
else
    echo "Database dump failed. Please check your connection and credentials."
fi