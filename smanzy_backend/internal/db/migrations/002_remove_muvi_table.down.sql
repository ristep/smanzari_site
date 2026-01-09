-- Rollback: Restore muvi table
-- Description: Recreates the muvi table if we need to roll back

CREATE TABLE IF NOT EXISTS muvi (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);
