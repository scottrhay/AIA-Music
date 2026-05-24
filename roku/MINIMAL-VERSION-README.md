# Minimal Version - Get It Compiling First

**Status:** Stripped down to bare essentials to debug compilation issues

---

## What This Version Does

**PlaylistSelector:**
- Shows 3 hardcoded test playlists
- No API calls
- Select with arrows, OK to choose

**AudioPlayer:**
- Just shows "AIA Music Player" text
- Status label changes on button press
- No audio playback yet
- No API calls yet

**Goal:** Get past compilation errors, prove the structure works

---

## Test Steps

1. Upload `AIAMusicRoku.zip` to Roku dev portal
2. Should install without compilation errors
3. Launch app
4. Should see "Select a Playlist (Test Mode)"
5. Select a playlist with OK
6. Should see "AIA Music Player" screen
7. Press OK → status changes to "OK button pressed!"
8. Press Back → returns to playlist list

**If this works:** We know the structure is good, can add features back incrementally

**If this fails:** We have a deeper BrightScript or manifest issue

---

## Next Steps (After This Compiles)

1. Add real API call to PlaylistSelector (fetch playlists)
2. Add real API call to AudioPlayer (fetch songs)
3. Add Audio node and playback logic
4. Add skip/previous controls
5. Add auto-play next song

**One feature at a time, test each step**

---

## What Was Removed

- All API calls (roUrlTransfer)
- Audio playback (Audio node)
- Complex state management
- Error handling for network/audio
- String conversions that might have syntax issues

**Everything that could cause compilation errors = stripped out**

---

**This should compile. If it doesn't, the issue is structural not syntax.**
