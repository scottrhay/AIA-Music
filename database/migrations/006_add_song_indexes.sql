-- Speed up the two most common song-listing filters (per-user library,
-- per-style listing), which previously had no index despite being the
-- primary WHERE clauses in songs.py's list/stats queries.
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_style_id ON songs(style_id);
