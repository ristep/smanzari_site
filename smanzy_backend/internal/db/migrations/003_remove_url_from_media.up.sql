-- Migration: Remove url from media
-- Description: Removes the unused url column from the media table

ALTER TABLE media DROP COLUMN IF EXISTS url;
