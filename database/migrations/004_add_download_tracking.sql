-- Migration: Add download tracking to songs
-- Date: 2026-01-02

USE aiaspeech_db;

-- Add columns to track if files have been auto-downloaded
ALTER TABLE songs ADD COLUMN downloaded_url_1 BOOLEAN DEFAULT FALSE AFTER download_url_1;
ALTER TABLE songs ADD COLUMN downloaded_url_2 BOOLEAN DEFAULT FALSE AFTER download_url_2;

-- Add index for filtering downloaded songs
CREATE INDEX idx_songs_downloaded ON songs(downloaded_url_1, downloaded_url_2);
