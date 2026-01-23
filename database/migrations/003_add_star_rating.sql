-- Migration: Add star rating to songs
-- Date: 2026-01-01

USE aiaspeech_db;

-- Add star_rating column to songs table
ALTER TABLE songs ADD COLUMN star_rating INT DEFAULT 0 AFTER version;

-- Add index for filtering by star rating
CREATE INDEX idx_songs_star_rating ON songs(star_rating);

-- Add constraint to ensure star_rating is between 0 and 5
ALTER TABLE songs ADD CONSTRAINT chk_star_rating CHECK (star_rating >= 0 AND star_rating <= 5);
