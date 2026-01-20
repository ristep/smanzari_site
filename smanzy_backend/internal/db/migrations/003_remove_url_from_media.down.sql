-- Migration: Restore url to media
-- Description: Restores the url column to the media table

ALTER TABLE media ADD COLUMN IF NOT EXISTS url TEXT;

-- Populate url column with data if possible (using stored_name and a default base path)
-- Note: This is a best-effort restoration. 
UPDATE media SET url = '/api/media/files/' || stored_name WHERE url IS NULL;

ALTER TABLE media ALTER COLUMN url SET NOT NULL;
