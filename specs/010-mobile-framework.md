# Feature Specification: AIA Mobile Shell (Reusable Framework)

> **Template Version**: 1.0 | Based on [Spec Kit](https://speckit.org) methodology

---

**Feature Number**: 010  
**Created**: 2026-02-26  
**Status**: Draft — Awaiting Scott Review  
**Author**: Rav (Product Manager)  
**Platform**: AIA Platform (reusable across all client apps)  

---

## Overview

### Problem Statement

Every client app we build (AIA-Music, Scheduling Assistant, Homeschool, Regent Dashboard, future clients) needs mobile support. Building mobile from scratch for each app is expensive and slow. We need a reusable shell that gives any app mobile capabilities with minimal per-client work.

### Proposed Solution

**AIA Mobile Shell** — a configurable PWA framework that wraps any AIA client backend into a mobile-ready app. Drop in a config file (branding, auth, API endpoints) and get:
- Responsive layout with mobile navigation
- PWA install flow
- Push notifications
- Offline support (service worker)
- Themed per client (colors, logo, fonts)
- Auth flow (login, registration, password reset)

AIA-Music is the first app built on this shell. Every subsequent client app reuses the same framework.

---

## User Scenarios

### User Story 1 — New Client App Setup (Priority: P1) — MVP

A developer (Lev) needs to create a mobile-ready app for a new client.

**Acceptance Scenarios:**

1. **Given** Lev has a new client backend (FastAPI + PostgreSQL)  
   **When** he creates a config file:
   ```json
   {
     "appName": "Regent Dashboard",
     "shortName": "Regent",
     "theme": {
       "primaryColor": "#1e40af",
       "backgroundColor": "#0f172a",
       "logo": "/assets/regent-logo.svg",
       "fontFamily": "Inter"
     },
     "auth": {
       "provider": "jwt",
       "loginEndpoint": "/api/auth/login",
       "registerEndpoint": "/api/auth/register"
     },
     "api": {
       "baseUrl": "https://regent.aiacopilot.com"
     },
     "navigation": [
       { "label": "Dashboard", "icon": "chart", "route": "/" },
       { "label": "Scorecard", "icon": "target", "route": "/scorecard" },
       { "label": "Action Plan", "icon": "list", "route": "/plan" },
       { "label": "Settings", "icon": "gear", "route": "/settings" }
     ],
     "pwa": {
       "offlinePages": ["/", "/scorecard"],
       "pushNotifications": true
     }
   }
   ```
   **Then** the shell renders a fully themed mobile app with those navigation items  
   **And** auth flows work against the client's API  
   **And** the PWA is installable with the correct branding

2. **Given** a client wants to change their brand colors  
   **When** the config `theme.primaryColor` is updated  
   **Then** the entire app re-themes without code changes  
   **And** the manifest.json auto-generates with matching colors

### User Story 2 — Shared Component Library (Priority: P1) — MVP

All client apps use the same base components, themed per client.

**Acceptance Scenarios:**

1. **Given** the shell provides `MobileNav`, `StickyHeader`, `AuthFlow`, `LoadingState`, `EmptyState`, `ErrorBoundary`  
   **When** a client app uses them  
   **Then** they render with the client's theme (colors, fonts, logo)  
   **And** follow consistent UX patterns across all AIA apps

2. **Given** a component needs client-specific behavior (e.g., AIA-Music has a player bar, Regent has a KPI ticker)  
   **When** the client app renders  
   **Then** the shell provides extension points (slots/plugins) for client-specific components  
   **And** the base layout remains consistent

### User Story 3 — Auth Integration (Priority: P1) — MVP

Auth is handled by **AIA-Auth** (spec #012) — a centralized, passwordless auth service. The mobile shell provides the frontend integration hooks.

**See spec #012 for full auth details.** The shell's responsibility is:
- `useAuth` hook: redirects to AIA-Auth login page, handles callback, manages session state
- Auth config in app config: `{ authUrl, appId, callbackUrl }`
- Unauthenticated → redirect to AIA-Auth (branded per app)
- Session expiry → redirect to AIA-Auth with "Session expired" message
- **Dependency:** #012 AIA-Auth must be deployed before any app can authenticate users

**Acceptance Scenarios:**

1. **Given** a user visits the app unauthenticated  
   **When** the shell detects no valid session  
   **Then** it redirects to `{authUrl}/login?app_id={appId}&redirect={callbackUrl}`

2. **Given** the user authenticates at AIA-Auth  
   **When** they're redirected back to the app's callback URL  
   **Then** the shell's `useAuth` hook processes the session token  
   **And** the user is authenticated and the app renders

3. **Given** the session expires  
   **When** an API call returns 401  
   **Then** the shell redirects to AIA-Auth login

### User Story 4 — Push Notification Infrastructure (Priority: P2)

Shared push notification system for all client apps.

**Acceptance Scenarios:**

1. **Given** `pwa.pushNotifications` is true in the config  
   **When** the app loads for the first time  
   **Then** a notification permission prompt appears (contextual, not on load)  
   **And** on opt-in, the subscription is registered with the backend

2. **Given** the backend needs to send a push notification  
   **When** it calls the shared push API: `POST /api/push/send { userId, title, body, url }`  
   **Then** the notification is delivered to the user's device  
   **And** tapping it opens the app to the specified URL

---

## Framework Architecture

```
/aia-mobile-shell/
├── src/
│   ├── components/           # Shared UI components
│   │   ├── MobileNav.tsx     # Bottom tab navigation
│   │   ├── StickyHeader.tsx  # Top bar with title + actions
│   │   ├── AuthFlow/         # Login, Register, ForgotPassword
│   │   ├── LoadingState.tsx  # Skeleton loaders
│   │   ├── EmptyState.tsx    # "No items" placeholder
│   │   ├── ErrorBoundary.tsx # Error handling
│   │   ├── InstallBanner.tsx # PWA install prompt
│   │   └── PushOptIn.tsx     # Notification permission
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth state management
│   │   ├── useApi.ts         # API client with auth headers
│   │   ├── useTheme.ts       # Theme from config
│   │   ├── useOffline.ts     # Online/offline detection
│   │   └── usePush.ts       # Push notification management
│   ├── layouts/
│   │   ├── MobileLayout.tsx  # Bottom nav + content area
│   │   └── DesktopLayout.tsx # Sidebar + content area
│   ├── pwa/
│   │   ├── service-worker.ts # Configurable caching strategies
│   │   └── manifest.ts      # Auto-generate from config
│   ├── theme/
│   │   └── ThemeProvider.tsx # CSS variables from config
│   └── config/
│       └── schema.ts         # Config validation (Zod)
├── package.json              # Published as @aia/mobile-shell
└── README.md
```

### Usage in Client App

```tsx
// AIA-Music app entry
import { AiaMobileShell } from '@aia/mobile-shell';
import config from './app.config.json';
import { MusicRoutes } from './routes';

export default function App() {
  return (
    <AiaMobileShell config={config}>
      <MusicRoutes />
    </AiaMobileShell>
  );
}
```

### Config Schema

| Section | Required | Description |
|---------|----------|-------------|
| `appName` | Yes | Full app name |
| `shortName` | Yes | PWA short name (< 12 chars) |
| `theme` | Yes | Colors, logo, font |
| `auth` | Yes | Provider type + endpoints |
| `api.baseUrl` | Yes | Backend API base URL |
| `navigation` | Yes | Bottom nav items (2-5 items) |
| `pwa.offlinePages` | No | Routes to precache for offline |
| `pwa.pushNotifications` | No | Enable push infrastructure |

---

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Config-driven theming (colors, logo, fonts) | MUST |
| FR-002 | Bottom navigation bar (2-5 configurable items) | MUST |
| FR-003 | Auth flow (JWT + OAuth) | MUST |
| FR-004 | PWA manifest auto-generation from config | MUST |
| FR-005 | Service worker with configurable caching | MUST |
| FR-006 | Responsive breakpoints (mobile/tablet/desktop) | MUST |
| FR-007 | Extension points for client-specific components | MUST |
| FR-008 | Push notification infrastructure | SHOULD |
| FR-009 | Published as npm package (@aia/mobile-shell) | SHOULD |
| FR-010 | Storybook for component documentation | SHOULD |

---

## Out of Scope

- Native app wrapper (Capacitor/React Native) — v2
- CMS / drag-and-drop page builder — not planned
- Multi-language i18n — v2
- Analytics SDK integration — v2
- A/B testing framework — not planned

---

## Success Criteria

| ID | Metric | Target |
|----|--------|--------|
| SC-001 | New client app setup time | < 4 hours (config + custom routes) |
| SC-002 | Apps using the shell | 2+ within 60 days (AIA-Music + one more) |
| SC-003 | Lighthouse PWA score for all shell apps | > 90 |
| SC-004 | Component reuse rate | > 70% of UI is shared components |

---

*"Unless the Lord builds the house, the builders labor in vain." — Psalm 127:1*
