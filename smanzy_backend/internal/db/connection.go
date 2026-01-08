package db

import (
	"database/sql"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// Connect establishes a connection to the database using the pgx driver
func Connect(dsn string) (*sql.DB, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}
