# Split Suno Tracks into Individual Songs

## Problem
When Suno generates music, it returns 2 tracks. Currently both tracks are stored on a single song record (`download_url_1` and `download_url_2`) and displayed as one tile. Users can't rate or delete tracks independently.

## Solution: Option B - Separate Songs with Linkage

**Approach**: When webhook receives 2 audio URLs, create 2 separate Song records. Each song has its own:
- `download_url` (single URL)
- `star_rating`
- Delete capability
- Playlist membership

Songs from the same generation are linked via `sibling_group_id` (uses the suno_task_id) for tracking purposes.

## Schema Changes

### Song Model
- `download_url_1` → `download_url` (renamed, single URL)
- `download_url_2` → removed
- `downloaded_url_1` → `downloaded` (renamed)
- `downloaded_url_2` → removed
- `archived_url_1` → `archived_url` (renamed)
- `archived_url_2` → removed
- **NEW**: `sibling_group_id` (String) - links songs from same Suno generation
- **NEW**: `track_number` (Integer) - 1 or 2 to identify which variation

### Backward Compatibility
Existing songs with `download_url_1/2` will be migrated:
- Songs with only `download_url_1` → `download_url` (simple rename)
- Songs with both URLs → Split into 2 songs, linked by `sibling_group_id`

## Implementation Details

### Backend
1. **models.py**: Update Song schema
2. **webhooks.py**: Create 2 songs when receiving 2 audio URLs
3. **songs.py**: Update archiving and other logic for single URL

### Frontend
1. **SongCard.js**: Simplified - single audio player per card
2. Each card has independent rating/delete/playlist controls

### Migration Script
- `backend/scripts/migrate_split_tracks.py` - splits existing dual-track songs
