# AIA Music Roku Player - V1 MVP

Simple player-only Roku app for streaming AIA Music playlists.

## Features

✅ Select from available playlists  
✅ Auto-play through all songs in playlist  
✅ Basic controls: Play/Pause, Skip Next, Skip Previous  
✅ Minimal UI (player-only, no library browsing)

## Controls

- **OK Button**: Play/Pause
- **Right Arrow**: Skip to next song
- **Left Arrow**: Previous song (or restart current)
- **Back Button**: Return to playlist selector

## Setup & Installation

### 1. Enable Developer Mode on Roku

1. On your Roku, press Home 3x, Up 2x, Right, Left, Right, Left, Right
2. Enable Developer Mode
3. Set a password (default: 1718roku)
4. Note the Roku's IP address (192.168.1.71)

### 2. Configure Auth Token

Edit `source/main.brs` line 15:
```brightscript
scene.authToken = "YOUR_ACTUAL_JWT_TOKEN"
```

Get a valid JWT token from AIA Music:
- Login at https://music.aiacopilot.com
- Open browser DevTools → Application → Local Storage
- Copy the `access_token` value

### 3. Package the App

From this directory:
```powershell
# Windows
Compress-Archive -Path * -DestinationPath AIAMusicRoku.zip -Force

# Or use the included script
.\package.ps1
```

### 4. Sideload to Roku

1. Open browser: http://192.168.1.71
2. Login with credentials:
   - Username: `rokudev`
   - Password: `1718roku`
3. Upload `AIAMusicRoku.zip`
4. Click "Install"

## File Structure

```
AIAMusicRoku/
├── manifest                      # App metadata
├── source/
│   └── main.brs                  # Entry point
├── components/
│   ├── MainScene.xml             # Main orchestrator
│   ├── PlaylistSelector.xml      # Playlist list view
│   ├── PlaylistListItem.xml      # List item renderer
│   └── AudioPlayer.xml           # Player with controls
└── images/
    └── (optional splash/icons)
```

## API Endpoints Used

**Base URL:** `https://music.aiacopilot.com/api/v1`

- `GET /playlists` - List all playlists
- `GET /playlists/{id}/songs` - Get songs in playlist

## Troubleshooting

**"Network error. Check connection."**
- Verify Roku has internet access
- Check API base URL is correct
- Ensure auth token is valid

**"No audio URL for this song"**
- Song may not have completed Suno generation
- Check song status in web app

**Audio won't play**
- Verify audio URLs are publicly accessible
- Check Roku can reach Azure Blob Storage (or wherever audio is hosted)

## Tech Stack

- **Language:** BrightScript
- **UI Framework:** SceneGraph XML
- **Audio:** Roku Audio Node (MP3 streaming)

## Future Enhancements (V2+)

- Token refresh handling
- Search/filter playlists
- Song ratings display
- Resume from last position
- Shuffle/repeat modes
- Better error handling
- Fancy UI with album art

## Development Notes

**Roku Dev Portal:** http://192.168.1.71  
**API Docs:** See `\\diamondstar\ai$\AIAMusic\README.md`

---

**Built by:** Tov  
**Version:** 1.0.0  
**Date:** 2026-02-05
