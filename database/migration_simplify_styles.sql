-- Migration: Simplify styles table to match Excel workflow
-- This removes individual fields and replaces with a single style_prompt field

USE aiaspeech_db;

-- Add new style_prompt column
ALTER TABLE styles ADD COLUMN style_prompt TEXT AFTER name;

-- Migrate existing data: combine all fields into style_prompt
UPDATE styles SET style_prompt = CONCAT_WS(
    '\n\n',
    CONCAT('Genre: ', COALESCE(genre, '')),
    CONCAT('Beat: ', COALESCE(beat, '')),
    CONCAT('Mood: ', COALESCE(mood, '')),
    CONCAT('Vocals: ', COALESCE(vocals, '')),
    CONCAT('Instrumentation: ', COALESCE(instrumentation, '')),
    CONCAT('Description: ', COALESCE(style_description, ''))
) WHERE style_prompt IS NULL;

-- Drop old columns (keep created_by, created_at, updated_at)
ALTER TABLE styles
    DROP COLUMN genre,
    DROP COLUMN beat,
    DROP COLUMN mood,
    DROP COLUMN vocals,
    DROP COLUMN instrumentation,
    DROP COLUMN style_description;

-- Update the view
DROP VIEW IF EXISTS song_details_view;

CREATE VIEW song_details_view AS
SELECT
    s.id,
    s.specific_title,
    s.specific_lyrics,
    s.prompt_to_generate,
    s.status,
    s.vocal_gender,
    s.download_url_1,
    s.download_url_2,
    s.speech_task_id,
    s.created_at,
    s.updated_at,
    u.username as creator_username,
    u.email as creator_email,
    st.name as style_name,
    st.style_prompt
FROM songs s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN styles st ON s.style_id = st.id;
