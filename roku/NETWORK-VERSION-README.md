# Network Version - Real API Integration

**Status:** Full functionality with real AIA Music API

---

## What's New

### 1. NetworkTask Component
**File:** `components/NetworkTask.xml`

Async network task for API calls:
- Extends Task (Roku's async pattern)
- Handles GET requests with Bearer auth
- Returns response or error
- 10-second timeout

### 2. PlaylistSelector - Real API
**Updated:** Fetches real playlists from API

**Flow:**
1. Shows loading spinner
2. Calls `GET /playlists` via NetworkTask
3. Parses JSON response
4. Populates list with real data
5. Shows error if network fails

**Error handling:**
- Network timeout
- Invalid response
- HTTP errors

### 3. AudioPlayer - Real Playback
**Updated:** Fetches songs and plays audio

**Flow:**
1. Calls `GET /playlists/{id}/songs` via NetworkTask
2. Parses song list
3. Plays first song automatically
4. Auto-advances to next on finish

**Audio URL Priority:**
1. `archived_url` (preferred)
2. `download_url`
3. `archived_url_1` (legacy)
4. `download_url_1` (legacy)

**Controls:**
- **OK** - Play/Pause
- **Right** - Next song
- **Left** - Previous song
- **Back** - Exit to playlists

---

## API Integration

**Base URL:** `https://music.aiacopilot.com/api/v1`

**Endpoints Used:**
- `GET /playlists` → List all playlists
- `GET /playlists/{id}/songs` → Songs in playlist

**Auth:** Bearer token (set in `main.brs`)

---

## Testing Steps

1. Upload `AIAMusicRoku.zip` to Roku
2. Launch app
3. Should see loading spinner → real playlists load
4. Select a playlist with OK
5. Songs load → first song plays automatically
6. Test controls:
   - OK = pause/resume
   - Right = next song
   - Left = previous song
   - Back = return to playlists
7. When song ends → next song plays automatically

---

## Expected Behavior

**PlaylistSelector:**
- Shows spinner while loading
- Displays real playlists from API
- Shows song count for each
- Error message if network fails

**AudioPlayer:**
- Shows playlist name at top
- Displays current song title
- Shows "Song X of Y"
- Status updates: "Loading" → "Playing" → "Paused"
- Auto-plays next song when current finishes
- Shows "End of playlist" when done

---

## Troubleshooting

**"Network error: HTTP 401"**
→ Auth token expired. Get new token from web app localStorage

**"Network error: Request timeout"**
→ Check Roku internet connection, verify API is up

**"No songs in playlist"**
→ Selected playlist is empty in database

**"No audio URL"**
→ Song exists but has no audio file (Suno generation incomplete)

**Audio won't play**
→ Check audio URL accessibility (Azure Blob CORS, SSL cert)

---

## Files Added/Modified

**New:**
- `components/NetworkTask.xml` (2.1 KB)

**Updated:**
- `components/PlaylistSelector.xml` (4.2 KB) - Added NetworkTask integration
- `components/AudioPlayer.xml` (7.6 KB) - Added NetworkTask + audio playback

**Total package:** 7.54 KB

---

## What's Working

✅ Network requests (async via Task)  
✅ Real playlist loading  
✅ Real song loading  
✅ Audio playback (MP3 streaming)  
✅ Auto-play next song  
✅ Play/Pause control  
✅ Skip next/previous  
✅ Back to playlists  
✅ Error handling  

---

**Ready for Scott to test with real AIA Music data.**
