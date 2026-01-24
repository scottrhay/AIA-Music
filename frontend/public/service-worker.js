/**
 * AIA Music Service Worker
 * Provides offline support and audio caching for the PWA
 */

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `aiamusic-static-${CACHE_VERSION}`;
const AUDIO_CACHE = `aiamusic-audio-${CACHE_VERSION}`;
const API_CACHE = `aiamusic-api-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Maximum number of audio files to cache (each ~10MB)
const MAX_AUDIO_CACHE_ITEMS = 50;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old versioned caches
              return name.startsWith('aiamusic-') &&
                     !name.endsWith(CACHE_VERSION);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Audio files - cache first, then network
  if (isAudioRequest(url)) {
    event.respondWith(cacheFirstAudio(request));
    return;
  }

  // JS/CSS files - network first to get latest updates
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Static assets - cache first, fall back to network
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

/**
 * Check if request is for an audio file
 */
function isAudioRequest(url) {
  // Check for audio file extensions
  if (url.pathname.endsWith('.mp3') ||
      url.pathname.endsWith('.wav') ||
      url.pathname.endsWith('.m4a')) {
    return true;
  }

  // Check for Suno API URLs
  if (url.hostname.includes('suno')) {
    return true;
  }

  // Check for Azure Blob Storage URLs
  if (url.hostname.includes('blob.core.windows.net')) {
    return true;
  }

  return false;
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network request failed:', error);
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    throw error;
  }
}

/**
 * Network-first strategy for API requests
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Cache-first strategy specifically for audio files with size management
 */
async function cacheFirstAudio(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Audio cache hit:', request.url);
    return cached;
  }

  try {
    console.log('[SW] Fetching audio:', request.url);
    const response = await fetch(request);

    if (response.ok) {
      // Check cache size and evict oldest if necessary
      await manageAudioCacheSize(cache);

      // Cache the audio file
      cache.put(request, response.clone());
      console.log('[SW] Audio cached:', request.url);
    }

    return response;
  } catch (error) {
    console.log('[SW] Audio fetch failed:', error);
    return new Response('Audio unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Manage audio cache size by removing oldest entries
 */
async function manageAudioCacheSize(cache) {
  const keys = await cache.keys();

  if (keys.length >= MAX_AUDIO_CACHE_ITEMS) {
    // Remove oldest entries (first in list)
    const toDelete = keys.slice(0, keys.length - MAX_AUDIO_CACHE_ITEMS + 1);
    for (const key of toDelete) {
      console.log('[SW] Evicting old audio:', key.url);
      await cache.delete(key);
    }
  }
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_AUDIO':
      // Pre-cache specific audio URLs
      if (payload && payload.urls) {
        cacheAudioUrls(payload.urls);
      }
      break;

    case 'CLEAR_AUDIO_CACHE':
      clearAudioCache();
      break;
  }
});

/**
 * Pre-cache a list of audio URLs
 */
async function cacheAudioUrls(urls) {
  const cache = await caches.open(AUDIO_CACHE);

  for (const url of urls) {
    if (!url) continue;

    try {
      const cached = await cache.match(url);
      if (!cached) {
        console.log('[SW] Pre-caching audio:', url);
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      }
    } catch (error) {
      console.log('[SW] Failed to pre-cache:', url, error);
    }
  }
}

/**
 * Clear the audio cache
 */
async function clearAudioCache() {
  console.log('[SW] Clearing audio cache');
  await caches.delete(AUDIO_CACHE);
}
