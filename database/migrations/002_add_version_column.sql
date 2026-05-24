-- Migration: Add version column to songs table
-- This allows tracking different versions of the same song

ALTER TABLE songs ADD COLUMN version VARCHAR(10) DEFAULT 'v1' AFTER specific_title;

-- Update existing songs to have version v1
UPDATE songs SET version = 'v1' WHERE version IS NULL OR version = '';

-- Create index on version for faster queries
CREATE INDEX idx_songs_version ON songs(version);
