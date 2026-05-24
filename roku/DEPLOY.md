# Quick Deploy Guide - AIA Music Roku App

**Status:** ✅ Code complete, ready to sideload

---

## Step 1: Get Your Auth Token

1. Go to https://music.aiacopilot.com
2. Login with your account
3. Open browser DevTools (F12)
4. Go to **Application** tab → **Local Storage** → `https://music.aiacopilot.com`
5. Find `access_token` and copy the value (starts with `eyJ...`)

---

## Step 2: Add Token to App

1. Open: `C:\Users\AIWork\AIAMusicRoku\source\main.brs`
2. Find line 15:
   ```brightscript
   scene.authToken = "YOUR_AUTH_TOKEN_HERE"
   ```
3. Replace `YOUR_AUTH_TOKEN_HERE` with your actual token
4. Save file

---

## Step 3: Package the App

Run from `C:\Users\AIWork\AIAMusicRoku\`:
```powershell
.\package.ps1
```

This creates `AIAMusicRoku.zip`

---

## Step 4: Sideload to Roku

1. Open browser: **http://192.168.1.71**
2. Login:
   - Username: `rokudev`
   - Password: `1718roku`
3. Under **"Upload Package"**:
   - Click **"Browse"**
   - Select `AIAMusicRoku.zip`
   - Click **"Install"**
4. Wait for installation (5-10 seconds)
5. App appears on Roku home screen: **"AIA Music Player"**

---

## Step 5: Test

1. Launch **"AIA Music Player"** on Roku
2. Should see list of your playlists
3. Select a playlist with OK button
4. Songs play automatically
5. Controls:
   - **OK** = Play/Pause
   - **Right** = Next song
   - **Left** = Previous song
   - **Back** = Return to playlist list

---

## Troubleshooting

**"Network error. Check connection."**
→ Auth token is invalid or expired. Go back to Step 1.

**App won't install**
→ Check Roku IP is correct (http://192.168.1.71)
→ Verify developer mode is enabled

**No playlists showing**
→ Check that you have playlists in your AIA Music account

**Audio won't play**
→ Songs may not have audio URLs yet (check in web app)

---

## Files Location

**Source:** `C:\Users\AIWork\AIAMusicRoku\`  
**Package:** `C:\Users\AIWork\AIAMusicRoku\AIAMusicRoku.zip`  
**Roku Dev Portal:** http://192.168.1.71

---

**Total Deploy Time:** 5-10 minutes  
**Next Steps:** Test on Roku, report any issues
