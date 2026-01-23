# AIA Speech Studio - iPhone App Development Plan

## Executive Summary

This document outlines a comprehensive plan to develop a native iPhone application for AIA Speech Studio, extending the existing web-based text-to-speech platform to iOS. The app will leverage the existing Flask backend API while providing a native, optimized mobile experience.

---

## Table of Contents

1. [Technology Stack Decision](#1-technology-stack-decision)
2. [Architecture Overview](#2-architecture-overview)
3. [Core Features](#3-core-features)
4. [Development Phases](#4-development-phases)
5. [API Considerations](#5-api-considerations)
6. [Authentication Strategy](#6-authentication-strategy)
7. [UI/UX Design Guidelines](#7-uiux-design-guidelines)
8. [Offline Capabilities](#8-offline-capabilities)
9. [App Store Requirements](#9-app-store-requirements)
10. [Testing Strategy](#10-testing-strategy)
11. [Infrastructure Requirements](#11-infrastructure-requirements)
12. [Timeline & Milestones](#12-timeline--milestones)
13. [Risk Assessment](#13-risk-assessment)

---

## 1. Technology Stack Decision

### Recommended: Native Swift/SwiftUI

| Criteria | SwiftUI (Native) | React Native | Flutter |
|----------|------------------|--------------|---------|
| Performance | Excellent | Good | Good |
| iOS Integration | Excellent | Moderate | Moderate |
| Audio Handling | Excellent | Requires bridges | Requires plugins |
| App Store Approval | Optimal | Good | Good |
| Long-term Maintenance | Best for iOS-only | Better for cross-platform | Better for cross-platform |
| Learning Curve | Moderate | Low (existing React team) | Moderate |

### Rationale for SwiftUI

1. **Audio-Centric App**: Native AVFoundation provides superior audio playback, background audio, and AirPlay support
2. **iOS-Specific Features**: Better integration with Siri Shortcuts, Widgets, ShareSheet, and system audio controls
3. **Performance**: Direct access to iOS APIs without JavaScript bridge overhead
4. **Future-Proof**: Apple's preferred UI framework with ongoing improvements
5. **App Store**: Native apps have better approval rates and performance characteristics

### Technology Stack Details

```
┌─────────────────────────────────────────────────────────────┐
│                    iPhone App Stack                         │
├─────────────────────────────────────────────────────────────┤
│  UI Framework      │  SwiftUI (iOS 16+)                     │
│  Architecture      │  MVVM with Combine                     │
│  Networking        │  URLSession + async/await              │
│  Audio             │  AVFoundation + AVKit                  │
│  Persistence       │  SwiftData (iOS 17+) / Core Data       │
│  Authentication    │  Keychain + AuthenticationServices     │
│  Dependencies      │  Swift Package Manager                 │
│  Minimum iOS       │  iOS 16.0                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        iPhone App                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Views    │  │ ViewModels  │  │   Models    │             │
│  │  (SwiftUI)  │◄─┤  (Combine)  │◄─┤   (Swift)   │             │
│  └─────────────┘  └──────┬──────┘  └─────────────┘             │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────┐              │
│  │              Service Layer                     │              │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │              │
│  │  │ APIClient│ │AudioMgr  │ │ CacheService │  │              │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │              │
│  └───────┼────────────┼──────────────┼──────────┘              │
└──────────┼────────────┼──────────────┼──────────────────────────┘
           │            │              │
           │    ┌───────▼───────┐      │
           │    │ Local Storage │      │
           │    │  (SwiftData)  │◄─────┘
           │    └───────────────┘
           │
    ┌──────▼──────────────────────────────────────┐
    │           Existing Backend                   │
    │  https://speech.aiacopilot.com/api/v1       │
    │  ┌────────┐ ┌────────┐ ┌────────────────┐   │
    │  │ Songs  │ │ Styles │ │ Azure Speech   │   │
    │  │  API   │ │  API   │ │     API        │   │
    │  └────────┘ └────────┘ └────────────────┘   │
    └──────────────────────────────────────────────┘
```

### Project Structure

```
AIASpeechStudio/
├── App/
│   ├── AIASpeechStudioApp.swift      # App entry point
│   ├── AppDelegate.swift             # UIKit lifecycle hooks
│   └── ContentView.swift             # Root view
├── Features/
│   ├── Authentication/
│   │   ├── Views/
│   │   │   ├── LoginView.swift
│   │   │   ├── RegisterView.swift
│   │   │   └── MicrosoftAuthView.swift
│   │   ├── ViewModels/
│   │   │   └── AuthViewModel.swift
│   │   └── Services/
│   │       └── AuthService.swift
│   ├── Songs/
│   │   ├── Views/
│   │   │   ├── SongListView.swift
│   │   │   ├── SongDetailView.swift
│   │   │   ├── SongCreateView.swift
│   │   │   └── SongPlayerView.swift
│   │   ├── ViewModels/
│   │   │   ├── SongListViewModel.swift
│   │   │   └── SongDetailViewModel.swift
│   │   └── Components/
│   │       ├── SongRowView.swift
│   │       ├── AudioPlayerControls.swift
│   │       └── StarRatingView.swift
│   ├── Styles/
│   │   ├── Views/
│   │   │   ├── StyleListView.swift
│   │   │   ├── StyleDetailView.swift
│   │   │   └── StyleCreateView.swift
│   │   └── ViewModels/
│   │       └── StyleViewModel.swift
│   └── Settings/
│       ├── Views/
│       │   └── SettingsView.swift
│       └── ViewModels/
│           └── SettingsViewModel.swift
├── Core/
│   ├── Network/
│   │   ├── APIClient.swift           # HTTP client with async/await
│   │   ├── APIEndpoints.swift        # Endpoint definitions
│   │   ├── APIError.swift            # Error handling
│   │   └── TokenInterceptor.swift    # JWT token management
│   ├── Audio/
│   │   ├── AudioManager.swift        # Playback controller
│   │   ├── AudioCache.swift          # MP3 caching
│   │   └── NowPlayingManager.swift   # Lock screen controls
│   ├── Storage/
│   │   ├── KeychainService.swift     # Secure credential storage
│   │   ├── CacheManager.swift        # Disk caching
│   │   └── UserDefaults+Extensions.swift
│   └── Utilities/
│       ├── Constants.swift
│       ├── Logger.swift
│       └── Extensions/
├── Models/
│   ├── User.swift
│   ├── Song.swift
│   ├── Style.swift
│   └── DTOs/                         # API response/request models
├── Resources/
│   ├── Assets.xcassets
│   ├── Localizable.strings
│   └── Info.plist
└── Tests/
    ├── UnitTests/
    └── UITests/
```

---

## 3. Core Features

### Phase 1: MVP Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **User Authentication** | Login, Register, Microsoft OAuth | P0 |
| **Song List** | View all songs with filters (status, voice, search) | P0 |
| **Song Details** | View song metadata, lyrics, prompt | P0 |
| **Audio Playback** | Play generated MP3s with controls | P0 |
| **Create Song** | Form to create new TTS requests | P0 |
| **Style Browser** | View available speech styles | P0 |

### Phase 2: Enhanced Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Offline Mode** | Cache songs for offline playback | P1 |
| **Background Audio** | Continue playback when app backgrounded | P1 |
| **Star Ratings** | Rate and filter by rating | P1 |
| **Voice Preview** | Preview Azure voices before selection | P1 |
| **Push Notifications** | Notify when TTS generation completes | P1 |
| **Share** | Share generated audio via iOS Share Sheet | P1 |

### Phase 3: Advanced Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Siri Shortcuts** | "Hey Siri, play my latest speech" | P2 |
| **Home Screen Widgets** | Quick status and recent songs | P2 |
| **Apple Watch Companion** | Basic playback controls | P2 |
| **iPad Optimization** | Multi-column layout for iPad | P2 |
| **AirPlay Support** | Cast to AirPlay devices | P2 |
| **CarPlay Integration** | In-car audio playback | P2 |

---

## 4. Development Phases

### Phase 1: Foundation (Weeks 1-4)

**Week 1-2: Project Setup & Core Infrastructure**
- [ ] Initialize Xcode project with SwiftUI
- [ ] Set up project structure and architecture
- [ ] Implement APIClient with async/await
- [ ] Create base models (User, Song, Style)
- [ ] Set up Keychain service for secure storage
- [ ] Configure CI/CD pipeline (Xcode Cloud or Fastlane)

**Week 3-4: Authentication Module**
- [ ] Implement LoginView with username/password
- [ ] Implement RegisterView with validation
- [ ] Integrate Microsoft OAuth using ASWebAuthenticationSession
- [ ] Implement JWT token storage and refresh logic
- [ ] Create AuthViewModel with state management
- [ ] Handle authentication errors gracefully

### Phase 2: Core Features (Weeks 5-10)

**Week 5-6: Song Management**
- [ ] Implement SongListView with filtering
- [ ] Create SongRowView component
- [ ] Implement pull-to-refresh
- [ ] Add search functionality
- [ ] Create SongDetailView
- [ ] Implement SongCreateView form

**Week 7-8: Audio Playback**
- [ ] Implement AudioManager with AVFoundation
- [ ] Create AudioPlayerControls component
- [ ] Add background audio support
- [ ] Implement Now Playing info (lock screen)
- [ ] Add playback controls (play/pause/seek)
- [ ] Implement audio caching for offline playback

**Week 9-10: Styles & Polish**
- [ ] Implement StyleListView
- [ ] Create StyleDetailView
- [ ] Add voice preview functionality
- [ ] Implement StarRatingView component
- [ ] Add haptic feedback
- [ ] Implement loading states and error handling

### Phase 3: Enhancement (Weeks 11-14)

**Week 11-12: Advanced Features**
- [ ] Implement push notifications (APNs)
- [ ] Add iOS Share Sheet integration
- [ ] Implement offline mode with SwiftData
- [ ] Add widget support (WidgetKit)

**Week 13-14: Testing & Release**
- [ ] Comprehensive unit testing
- [ ] UI testing with XCTest
- [ ] Performance optimization
- [ ] App Store assets preparation
- [ ] TestFlight beta release
- [ ] App Store submission

---

## 5. API Considerations

### Existing API Compatibility

The current backend API is REST-based and fully compatible with iOS. No backend changes required for basic functionality.

**Base URL**: `https://speech.aiacopilot.com/api/v1`

### API Endpoints Used by iOS App

```swift
// Authentication
POST /auth/login          → LoginRequest → AuthResponse
POST /auth/register       → RegisterRequest → AuthResponse
POST /auth/microsoft/login → → RedirectURL
GET  /auth/me             → → User

// Songs
GET    /songs             → QueryParams → [Song]
GET    /songs/:id         → → Song
POST   /songs             → CreateSongRequest → Song
PUT    /songs/:id         → UpdateSongRequest → Song
DELETE /songs/:id         → → Void
POST   /songs/:id/recreate → → Song
GET    /songs/stats       → → SongStats

// Styles
GET  /styles              → → [Style]
GET  /styles/:id          → → Style
POST /styles              → CreateStyleRequest → Style

// Speech
GET  /speech/voices       → → [Voice]
POST /speech/synthesize   → SynthesizeRequest → SynthesizeResponse
```

### Recommended Backend Enhancements

While the current API works, consider these additions for optimal mobile experience:

1. **Push Notifications Endpoint**
   ```
   POST /api/v1/devices/register
   Body: { "device_token": "apns_token", "platform": "ios" }
   ```

2. **Pagination Support**
   ```
   GET /api/v1/songs?page=1&limit=20&cursor=xxx
   Response: { "data": [...], "next_cursor": "yyy", "has_more": true }
   ```

3. **Batch Operations**
   ```
   POST /api/v1/songs/batch
   Body: { "ids": [1,2,3], "action": "delete" }
   ```

4. **ETag Support for Caching**
   ```
   GET /api/v1/songs
   Response Headers: ETag: "abc123"

   GET /api/v1/songs
   Request Headers: If-None-Match: "abc123"
   Response: 304 Not Modified
   ```

---

## 6. Authentication Strategy

### JWT Token Management

```swift
// KeychainService.swift
class KeychainService {
    static let shared = KeychainService()

    private let accessTokenKey = "com.aiacopilot.speech.accessToken"

    func storeToken(_ token: String) throws {
        // Store in Keychain with kSecAttrAccessibleWhenUnlocked
    }

    func retrieveToken() -> String? {
        // Retrieve from Keychain
    }

    func deleteToken() {
        // Remove from Keychain on logout
    }
}
```

### Token Refresh Strategy

Current backend uses 24-hour token expiry without refresh tokens. Recommended approach:

1. **Option A (No Backend Changes)**:
   - Detect 401 responses
   - Prompt user to re-authenticate
   - Store credentials securely for seamless re-login

2. **Option B (Backend Enhancement)**:
   - Add refresh token endpoint
   - Issue refresh tokens with 30-day expiry
   - Auto-refresh access tokens silently

### Microsoft OAuth Flow

```swift
// MicrosoftAuthService.swift
class MicrosoftAuthService {
    func authenticate() async throws -> AuthResponse {
        // 1. Open ASWebAuthenticationSession
        // 2. Navigate to /auth/microsoft/login
        // 3. Handle callback URL with authorization code
        // 4. Exchange code for JWT token
        // 5. Store token in Keychain
    }
}
```

### Biometric Authentication

Add Face ID/Touch ID for returning users:

```swift
import LocalAuthentication

func authenticateWithBiometrics() async throws -> Bool {
    let context = LAContext()
    return try await context.evaluatePolicy(
        .deviceOwnerAuthenticationWithBiometrics,
        localizedReason: "Log in to AIA Speech Studio"
    )
}
```

---

## 7. UI/UX Design Guidelines

### Design System

**Color Palette** (matching web app):
```swift
extension Color {
    static let aiaPrimary = Color(hex: "#007AFF")     // iOS Blue
    static let aiaSecondary = Color(hex: "#5856D6")   // Purple accent
    static let aiaBackground = Color(hex: "#F2F2F7")  // System background
    static let aiaSuccess = Color(hex: "#34C759")     // Green for completed
    static let aiaWarning = Color(hex: "#FF9500")     // Orange for pending
    static let aiaError = Color(hex: "#FF3B30")       // Red for failed
}
```

**Typography**:
- Use SF Pro (system font) for consistency
- Dynamic Type support for accessibility
- Heading: .title, .title2, .title3
- Body: .body, .callout
- Caption: .caption, .footnote

### Key Screens

#### 1. Home / Song List
```
┌─────────────────────────────────┐
│ AIA Speech Studio         ⚙️    │
├─────────────────────────────────┤
│ 🔍 Search songs...              │
├─────────────────────────────────┤
│ [All] [Completed] [Pending] [▼] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ ▶️ Morning Greeting          │ │
│ │ ⭐⭐⭐⭐☆  |  en-US-Andrew    │ │
│ │ Completed • 2 hours ago     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ⏳ Product Announcement      │ │
│ │ ☆☆☆☆☆  |  en-US-Jenny      │ │
│ │ Submitted • 5 min ago       │ │
│ └─────────────────────────────┘ │
│           ...                   │
├─────────────────────────────────┤
│ [🏠 Home] [📚 Styles] [➕ New]  │
└─────────────────────────────────┘
```

#### 2. Song Detail / Player
```
┌─────────────────────────────────┐
│ ← Back              ⋮ More      │
├─────────────────────────────────┤
│                                 │
│         🎵                      │
│    [Album Art/Waveform]         │
│                                 │
│    Morning Greeting             │
│    en-US-AndrewMultilingual     │
│                                 │
│    ──●────────────── 1:24/3:02  │
│                                 │
│      ⏮️    ▶️    ⏭️             │
│                                 │
│    ⭐⭐⭐⭐☆  Rate this          │
│                                 │
├─────────────────────────────────┤
│ Lyrics                          │
│ "Good morning! Welcome to..."   │
│                                 │
│ Style: Professional Narrator    │
│ Created: Jan 23, 2026           │
├─────────────────────────────────┤
│ [📤 Share] [🔄 Regenerate] [🗑️] │
└─────────────────────────────────┘
```

#### 3. Create Song
```
┌─────────────────────────────────┐
│ ← Cancel    Create Song   Save  │
├─────────────────────────────────┤
│ Title                           │
│ ┌─────────────────────────────┐ │
│ │ Enter title...              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Text to Synthesize              │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │ Enter the text you want    │ │
│ │ to convert to speech...    │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Voice                           │
│ ┌─────────────────────────────┐ │
│ │ en-US-Andrew (Male)      ▶️│ │
│ └─────────────────────────────┘ │
│                                 │
│ Style (Optional)                │
│ ┌─────────────────────────────┐ │
│ │ Select a style...        ▼ │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      Generate Speech        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Navigation Structure

```
TabView
├── Home (SongListView)
│   └── SongDetailView
│       └── AudioPlayerView
├── Styles (StyleListView)
│   └── StyleDetailView
│   └── CreateStyleView
├── Create (SongCreateView)
│   └── VoicePickerView
│   └── StylePickerView
└── Settings (SettingsView)
    └── ProfileView
    └── AboutView
```

### Accessibility Requirements

- VoiceOver support for all interactive elements
- Dynamic Type support (text scaling)
- Sufficient color contrast (WCAG AA)
- Reduce Motion support
- Button minimum tap target: 44x44 points

---

## 8. Offline Capabilities

### Caching Strategy

```swift
// CacheManager.swift
class CacheManager {
    // Audio files: Store in Caches directory
    // Metadata: Store in SwiftData/Core Data
    // Max cache size: 500MB (configurable)
    // Cache expiry: 30 days

    func cacheAudio(for song: Song) async throws {
        // Download MP3 from download_url_1
        // Store in Caches/Audio/{song_id}.mp3
        // Update song.isAvailableOffline = true
    }

    func getCachedAudioURL(for song: Song) -> URL? {
        // Return local file URL if cached
    }

    func clearCache() {
        // Remove all cached audio files
    }
}
```

### Offline Data Model (SwiftData)

```swift
@Model
class CachedSong {
    @Attribute(.unique) var id: Int
    var title: String
    var status: String
    var lyrics: String?
    var voiceName: String
    var starRating: Int
    var localAudioPath: String?
    var lastSynced: Date

    var isAvailableOffline: Bool {
        localAudioPath != nil
    }
}
```

### Sync Strategy

1. **On App Launch**: Fetch latest songs if online
2. **Pull to Refresh**: Manual sync trigger
3. **Background Refresh**: Use BGAppRefreshTask for periodic sync
4. **Offline Queue**: Store create/update requests for later sync

---

## 9. App Store Requirements

### App Information

- **App Name**: AIA Speech Studio
- **Subtitle**: Text-to-Speech Made Easy
- **Category**: Productivity / Utilities
- **Age Rating**: 4+ (no objectionable content)

### Required Assets

| Asset | Specifications |
|-------|---------------|
| App Icon | 1024x1024 PNG (no alpha) |
| iPhone Screenshots | 6.7" (1290x2796), 6.5" (1284x2778), 5.5" (1242x2208) |
| iPad Screenshots | 12.9" (2048x2732) |
| App Preview Video | 15-30 seconds, optional |

### Privacy & Compliance

**Privacy Policy Requirements**:
- Data collection disclosure (email, usage data)
- Third-party services (Azure, Microsoft)
- Data retention policy
- User rights (deletion, export)

**App Privacy Labels** (App Store Connect):
- Data Used to Track You: None
- Data Linked to You: Email, User ID
- Data Not Linked to You: Usage Data, Diagnostics

**Required Capabilities**:
```xml
<!-- Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>fetch</string>
</array>
<key>NSMicrophoneUsageDescription</key>
<string>Record audio for speech synthesis preview</string>
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to securely log in</string>
```

### App Store Review Considerations

1. **Login Required**: Provide demo account for reviewers
2. **Subscription**: If adding paid features, implement StoreKit 2
3. **Third-Party Login**: Microsoft OAuth must handle edge cases
4. **Audio Background**: Clearly explain audio playback use case

---

## 10. Testing Strategy

### Unit Testing

```swift
// SongViewModelTests.swift
class SongViewModelTests: XCTestCase {
    var sut: SongListViewModel!
    var mockAPIClient: MockAPIClient!

    func test_fetchSongs_success() async throws {
        // Given
        mockAPIClient.songsToReturn = [Song.mock()]

        // When
        await sut.fetchSongs()

        // Then
        XCTAssertEqual(sut.songs.count, 1)
        XCTAssertFalse(sut.isLoading)
    }

    func test_fetchSongs_failure() async throws {
        // Given
        mockAPIClient.errorToThrow = APIError.networkError

        // When
        await sut.fetchSongs()

        // Then
        XCTAssertNotNil(sut.error)
    }
}
```

### UI Testing

```swift
// SongListUITests.swift
class SongListUITests: XCTestCase {
    func test_songList_displaysCorrectly() {
        let app = XCUIApplication()
        app.launch()

        // Login
        app.textFields["Username"].tap()
        app.textFields["Username"].typeText("testuser")
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("password")
        app.buttons["Login"].tap()

        // Verify song list
        XCTAssertTrue(app.navigationBars["Songs"].exists)
        XCTAssertTrue(app.cells.count > 0)
    }
}
```

### Testing Pyramid

```
          ┌───────────┐
          │  Manual   │  ← App Store review, edge cases
          │  Testing  │
         ┌┴───────────┴┐
         │  UI Tests   │  ← Critical user flows
         │  (XCUITest) │
        ┌┴─────────────┴┐
        │ Integration   │  ← API integration, persistence
        │ Tests         │
       ┌┴───────────────┴┐
       │   Unit Tests    │  ← ViewModels, Services, Utilities
       │   (XCTest)      │
       └─────────────────┘
```

---

## 11. Infrastructure Requirements

### Development Environment

- **Xcode**: 15.0+ (latest stable)
- **macOS**: Sonoma 14.0+
- **iOS Simulators**: iPhone 15 Pro, iPhone SE (3rd gen)
- **Physical Devices**: For audio testing and performance

### CI/CD Pipeline

**Option A: Xcode Cloud** (Recommended)
- Native Apple integration
- Automatic signing
- TestFlight deployment

**Option B: GitHub Actions + Fastlane**
```yaml
# .github/workflows/ios.yml
name: iOS Build
on: [push, pull_request]
jobs:
  build:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: xcodebuild -scheme AIASpeechStudio -sdk iphonesimulator
      - name: Test
        run: xcodebuild test -scheme AIASpeechStudio -sdk iphonesimulator
```

### Backend Requirements

| Requirement | Current Status | Action Needed |
|-------------|---------------|---------------|
| HTTPS API | ✅ Implemented | None |
| JWT Auth | ✅ Implemented | None |
| CORS | ✅ Configured | Add iOS bundle ID |
| Push Notifications | ❌ Not implemented | Add APNs endpoint |
| Rate Limiting | ⚠️ Basic | Consider mobile-specific limits |

### Push Notification Setup

1. **Apple Developer Portal**:
   - Create APNs key
   - Download .p8 file

2. **Backend Addition**:
   ```python
   # New endpoint for device registration
   @app.route('/api/v1/devices/register', methods=['POST'])
   def register_device():
       token = request.json['device_token']
       # Store in database
       # Send notifications via APNs when song completes
   ```

---

## 12. Timeline & Milestones

### Gantt Chart Overview

```
Week:  1   2   3   4   5   6   7   8   9  10  11  12  13  14
       ├───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┤
Phase 1: Foundation
       [=======]  Project Setup
           [=======]  Authentication

Phase 2: Core Features
               [=======]  Song Management
                   [=======]  Audio Playback
                       [=======]  Styles & Polish

Phase 3: Enhancement
                               [=======]  Advanced Features
                                   [=======]  Testing & Release

Milestones:
       ▼ M1      ▼ M2          ▼ M3          ▼ M4      ▼ M5
```

### Milestone Definitions

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M1: Foundation Complete | Week 4 | Auth working, basic navigation |
| M2: Core MVP | Week 8 | Song list, playback, creation |
| M3: Feature Complete | Week 10 | All P0/P1 features working |
| M4: Beta Release | Week 12 | TestFlight release |
| M5: App Store Launch | Week 14 | Public release |

---

## 13. Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Audio playback issues | Medium | High | Test extensively on devices; use proven AVFoundation patterns |
| API rate limiting | Low | Medium | Implement exponential backoff; cache aggressively |
| App Store rejection | Medium | High | Follow guidelines strictly; provide test account |
| OAuth callback issues | Medium | Medium | Handle all edge cases; provide fallback login |
| Large audio files | Low | Medium | Implement streaming; show download progress |

### Resource Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| iOS developer availability | Medium | High | Plan for cross-training or contractor backup |
| Backend changes delayed | Low | Medium | Design for current API; make backend changes optional |
| Device testing coverage | Medium | Low | Use TestFlight for broader device coverage |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low adoption | Medium | Medium | Implement analytics; iterate based on feedback |
| Competitor apps | Low | Low | Focus on unique Azure TTS integration |
| Apple policy changes | Low | High | Stay updated on App Store guidelines |

---

## Appendix A: Technology Alternatives

### If Cross-Platform Required

**React Native** (Alternative to SwiftUI):
- Pros: Shared codebase with web team, faster initial development
- Cons: Audio handling complexity, native module dependencies
- Recommendation: Use if Android app planned within 6 months

**Flutter** (Alternative to SwiftUI):
- Pros: Single codebase, good performance, growing ecosystem
- Cons: Dart learning curve, larger app size
- Recommendation: Consider for greenfield cross-platform projects

### Audio Libraries

| Library | Use Case |
|---------|----------|
| AVFoundation | ✅ Recommended - Native, full-featured |
| AudioKit | Advanced audio processing (not needed) |
| StreamingKit | HTTP streaming (consider if adding live streams) |

---

## Appendix B: Sample Code

### APIClient Implementation

```swift
// Core/Network/APIClient.swift
import Foundation

actor APIClient {
    static let shared = APIClient()

    private let baseURL = URL(string: "https://speech.aiacopilot.com/api/v1")!
    private let session: URLSession

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }

    func request<T: Decodable>(
        endpoint: APIEndpoint,
        method: HTTPMethod = .get,
        body: Encodable? = nil
    ) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add JWT token if available
        if let token = KeychainService.shared.retrieveToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            return try JSONDecoder().decode(T.self, from: data)
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        default:
            throw APIError.serverError(httpResponse.statusCode)
        }
    }
}
```

### AudioManager Implementation

```swift
// Core/Audio/AudioManager.swift
import AVFoundation
import MediaPlayer

@MainActor
class AudioManager: ObservableObject {
    static let shared = AudioManager()

    @Published var isPlaying = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var currentSong: Song?

    private var player: AVPlayer?
    private var timeObserver: Any?

    func play(song: Song) async throws {
        guard let urlString = song.downloadUrl1,
              let url = URL(string: urlString) else {
            throw AudioError.invalidURL
        }

        // Configure audio session for playback
        try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
        try AVAudioSession.sharedInstance().setActive(true)

        // Create player
        let playerItem = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: playerItem)

        // Observe time
        timeObserver = player?.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.5, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            self?.currentTime = time.seconds
        }

        // Update duration when ready
        if let duration = try? await playerItem.asset.load(.duration) {
            self.duration = duration.seconds
        }

        currentSong = song
        player?.play()
        isPlaying = true

        // Setup Now Playing info
        updateNowPlayingInfo(song: song)
    }

    func togglePlayPause() {
        if isPlaying {
            player?.pause()
        } else {
            player?.play()
        }
        isPlaying.toggle()
    }

    private func updateNowPlayingInfo(song: Song) {
        var info = [String: Any]()
        info[MPMediaItemPropertyTitle] = song.specificTitle
        info[MPMediaItemPropertyArtist] = song.voiceName
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        info[MPMediaItemPropertyPlaybackDuration] = duration
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
}
```

---

## Appendix C: Checklist

### Pre-Development Checklist

- [ ] Apple Developer account active ($99/year)
- [ ] Xcode 15+ installed
- [ ] iOS development certificates configured
- [ ] Backend team aligned on API requirements
- [ ] Design mockups approved
- [ ] Privacy policy drafted

### Pre-Release Checklist

- [ ] All P0 features working
- [ ] Unit test coverage > 70%
- [ ] UI tests for critical flows
- [ ] Performance testing completed
- [ ] Accessibility audit passed
- [ ] App Store assets prepared
- [ ] Privacy policy published
- [ ] Demo account for reviewers created
- [ ] TestFlight beta testing completed
- [ ] Crash reporting integrated (Sentry/Firebase)
- [ ] Analytics integrated

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-23 | Claude | Initial plan |

---

*This document should be reviewed and updated as the project progresses.*
