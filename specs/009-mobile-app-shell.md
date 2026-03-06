# Feature Specification: AIA-Music Mobile App Shell

> **Template Version**: 1.0 | Based on [Spec Kit](https://speckit.org) methodology

---

**Feature Number**: 009  
**Created**: 2026-02-26  
**Status**: Draft — Awaiting Scott Review  
**Author**: Rav (Product Manager)  
**Platform**: AIA-Music (PWA)  

---

## Overview

### Problem Statement

AIA-Music is web-only. Users can't generate music on their phones without opening a browser, navigating to the URL, and dealing with a non-optimized layout. No home screen icon, no push notifications, no offline access. It doesn't feel like a real app.

### Platform Evaluation

| Option | Time to Ship | iOS + Android | App Store Required | Offline | Push Notifications | Shared Codebase |
|--------|-------------|---------------|--------------------|---------|--------------------|-----------------|
| **PWA** | 1-2 weeks | Yes | No | Yes | Yes (limited iOS) | Yes (it's the web app) |
| React Native | 4-8 weeks | Yes | Yes (review delays) | Yes | Yes | Separate from web |
| Native (Swift/Kotlin) | 8-16 weeks | Yes | Yes | Yes | Yes | Two codebases |

### Recommendation: PWA First

**PWA wins on every axis except iOS push notifications** (limited to iOS 16.4+, requires user opt-in from home screen). For a music generation app where the primary interaction is "type prompt → wait → listen," PWA is ideal:

- Ship in 1-2 weeks, not months
- No app store review or fees
- Same codebase as web
- Users install from browser — no friction
- Works offline for library browsing (generation requires network)

If adoption exceeds 10K users and iOS push becomes critical, wrap in Capacitor/React Native as v2.

---

## User Scenarios

### User Story 1 — Install App from Browser (Priority: P1) — MVP

**Acceptance Scenarios:**

1. **Given** a user visits AIA-Music on their phone (Chrome Android or Safari iOS)  
   **When** the page loads  
   **Then** a subtle install banner appears: "Add AIA-Music to your home screen for the best experience"  
   **And** tapping "Install" adds the app icon to their home screen  
   **And** subsequent launches open in standalone mode (no browser chrome)

2. **Given** a user opens AIA-Music from their home screen icon  
   **When** the app launches  
   **Then** it opens in standalone/fullscreen mode  
   **And** shows a branded splash screen during load  
   **And** feels like a native app (no URL bar, no browser tabs)

3. **Given** a user on iOS visits in Safari  
   **When** they tap Share → "Add to Home Screen"  
   **Then** the app installs with the correct icon and name  
   **And** opens in standalone mode

### User Story 2 — Responsive Music Generation (Priority: P1) — MVP

**Acceptance Scenarios:**

1. **Given** a user is on a mobile device (320px-428px width)  
   **When** they open the generation screen  
   **Then** the prompt input is full-width, thumb-friendly (min 44px touch targets)  
   **And** genre/mood selectors are horizontally scrollable chips (not a dropdown)  
   **And** the "Generate" button is prominent and bottom-anchored

2. **Given** a user generates a song on mobile  
   **When** generation is in progress  
   **Then** a progress indicator shows estimated time  
   **And** the user can navigate to their library while waiting  
   **And** a notification-style banner appears when generation completes

3. **Given** a user is on a tablet (768px-1024px)  
   **When** they use AIA-Music  
   **Then** the layout adapts: two-column on landscape, single-column on portrait

### User Story 3 — Music Library and Playback (Priority: P1) — MVP

**Acceptance Scenarios:**

1. **Given** a user opens their music library on mobile  
   **When** the library loads  
   **Then** songs are displayed as cards: title, date, duration, genre tag  
   **And** the list is scrollable with pull-to-refresh  
   **And** each card has a play button

2. **Given** a user taps play on a song  
   **When** playback starts  
   **Then** a sticky player bar appears at the bottom (above navigation)  
   **And** shows: song title, play/pause, progress bar, time  
   **And** the player persists across navigation (doesn't restart on page change)

3. **Given** a user locks their phone while music is playing  
   **When** the screen is locked  
   **Then** playback continues (Media Session API)  
   **And** lock screen controls show play/pause, skip, song title

### User Story 4 — Offline Library Access (Priority: P2)

**Acceptance Scenarios:**

1. **Given** a user has previously played songs  
   **When** they lose network connectivity  
   **Then** cached songs in their library are still playable  
   **And** generation is disabled with message: "Music generation requires an internet connection"  
   **And** library displays cached songs with an offline indicator

2. **Given** connectivity is restored  
   **When** the app reconnects  
   **Then** any pending operations sync  
   **And** the full library is refreshed

### User Story 5 — Push Notifications (Priority: P2)

**Acceptance Scenarios:**

1. **Given** a user has installed the PWA and opted into notifications  
   **When** their song generation completes (took 30+ seconds)  
   **Then** they receive a push notification: "Your song is ready! Tap to listen."  
   **And** tapping opens the app to the completed song

2. **Given** a user on iOS (Safari, home screen installed)  
   **When** they haven't opted in  
   **Then** no notification prompt appears until first generation completes  
   **And** prompt is contextual: "Get notified when your songs are ready?"

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User on an older browser (no PWA support) | App works as normal website. Install prompt doesn't appear. |
| User's phone storage is full | Service worker caching fails gracefully. App still works online. |
| Slow 3G connection | Show skeleton loading states. Generation shows "This may take longer on slow connections." |
| User rotates device mid-generation | Layout adapts without losing generation state |
| Audio focus conflict (phone call comes in) | Playback pauses. Resumes when call ends (Media Session API). |
| Multiple tabs open | Only one tab plays audio at a time. Latest tab takes priority. |

---

## Technical Requirements

### Web App Manifest (`manifest.json`)

```json
{
  "name": "AIA-Music",
  "short_name": "AIA-Music",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Service Worker

- **Precache**: App shell (HTML, CSS, JS, icons)
- **Runtime cache**: Song audio files (cache-first, up to 200MB)
- **Network-first**: API calls (generation, library fetch)
- **Stale-while-revalidate**: User profile, credit balance

### Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 428px | Mobile single-column, bottom nav |
| 428px-768px | Large phone / small tablet, single-column with wider margins |
| 768px-1024px | Tablet, two-column on landscape |
| > 1024px | Desktop (existing layout, minimal changes) |

### Key Mobile Components

| Component | Behavior |
|-----------|----------|
| `MobileNav` | Bottom tab bar: Generate, Library, Account. 44px+ touch targets. |
| `StickyPlayer` | Fixed bottom bar above nav. Song title, play/pause, progress. Persists across navigation. |
| `GenerateForm` | Full-width prompt input, scrollable genre chips, bottom-anchored Generate button. |
| `SongCard` | Compact card: thumbnail, title, duration, play button. Swipe actions (share, delete). |
| `InstallBanner` | Dismissible banner prompting PWA install. Shows once, respects dismissal for 30 days. |

### Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse PWA score | > 90 |
| First Contentful Paint (mobile 3G) | < 2 seconds |
| Time to Interactive | < 4 seconds |
| Offline-capable | Yes (library + cached songs) |
| Service worker activation | On first visit |

---

## Out of Scope

- React Native / native app wrapper — v2 (if >10K users)
- Background audio recording/upload — v2
- Social sharing deep links — v2
- Wearable companion (Apple Watch) — not planned
- App Store submission — not needed for PWA

---

## Success Criteria

| ID | Metric | Target |
|----|--------|--------|
| SC-001 | PWA install rate | > 20% of mobile visitors install within first week |
| SC-002 | Lighthouse PWA score | > 90 |
| SC-003 | Mobile generation completion rate | Equal to desktop (no drop-off from UX issues) |
| SC-004 | Lock-screen playback | Works on Android + iOS |

---

*"Make a joyful noise to the Lord, all the earth!" — Psalm 100:1*
