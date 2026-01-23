-- Migration: Add 'failed' status to songs table
-- Run this on your production database to add the failed status option

-- Alter the status ENUM to include 'failed'
ALTER TABLE songs
MODIFY COLUMN status ENUM('create', 'submitted', 'completed', 'failed', 'unspecified') DEFAULT 'create';

-- Verify the change
DESCRIBE songs;
