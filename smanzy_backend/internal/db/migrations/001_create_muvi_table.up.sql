-- Migration: Create muvi table
-- Description: Creates the muvi table for movie/media management

CREATE TABLE IF NOT EXISTS muvi (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_muvi_name ON muvi(name);
CREATE INDEX IF NOT EXISTS idx_muvi_created_at ON muvi(created_at);
CREATE INDEX IF NOT EXISTS idx_muvi_deleted_at ON muvi(deleted_at) WHERE deleted_at IS NOT NULL;