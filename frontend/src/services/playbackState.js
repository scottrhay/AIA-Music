/**
 * Playback State Service
 * Saves and restores playback state to localStorage for resume functionality
 */

const STORAGE_KEY = 'aiamusic_playback_state';

/**
 * Get the saved playback state
 * @returns {Object|null} The saved playback state or null if none exists
 */
export function getPlaybackState() {
  try {
    const state = localStorage.getItem(STORAGE_KEY);
    if (state) {
      const parsed = JSON.parse(state);
      // Validate the state has required fields
      if (parsed.playlistId && typeof parsed.songIndex === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to get playback state:', err);
  }
  return null;
}

/**
 * Save the current playback state
 * @param {Object} state - The playback state to save
 * @param {string|number} state.playlistId - The current playlist ID
 * @param {number} state.songIndex - The current song index in the playlist
 * @param {number} state.track - The current track (1 or 2)
 * @param {number} state.currentTime - The current playback position in seconds
 * @param {number} state.volume - The volume level (0-1)
 */
export function savePlaybackState(state) {
  try {
    const toSave = {
      playlistId: state.playlistId,
      songIndex: state.songIndex,
      track: state.track || 1,
      currentTime: state.currentTime || 0,
      volume: state.volume ?? 1,
      savedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save playback state:', err);
  }
}

/**
 * Clear the saved playback state
 */
export function clearPlaybackState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear playback state:', err);
  }
}

/**
 * Detect if the current device is a mobile device
 * @returns {boolean} True if mobile device
 */
export function isMobileDevice() {
  // Check for touch capability and screen width
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;

  // Also check user agent for mobile keywords
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return (hasTouch && isSmallScreen) || mobileUserAgent;
}

/**
 * Check if user has previously used the player (has saved state)
 * @returns {boolean} True if there's saved playback state
 */
export function hasPlaybackHistory() {
  return getPlaybackState() !== null;
}
