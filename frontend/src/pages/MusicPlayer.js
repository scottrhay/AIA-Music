import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/Studio/TopBar';
import { getPlaylists, getPlaylist } from '../services/playlists';
import { getPlaybackState, savePlaybackState } from '../services/playbackState';
import '../theme/theme.css';
import './MusicPlayer.css';

function MusicPlayer({ onLogout, autoResume = false }) {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const hasRestoredState = useRef(false);
  const saveTimeoutRef = useRef(null);

  // ── Debug tracing ──
  const trace = useCallback((msg) => {
    console.log('[MusicPlayer]', msg);
  }, []);

  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(1); // 1 or 2
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingSeekTime, setPendingSeekTime] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Save playback state whenever relevant state changes (debounced)
  const saveState = useCallback(() => {
    if (!selectedPlaylistId || isRestoring) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves to avoid excessive writes
    saveTimeoutRef.current = setTimeout(() => {
      savePlaybackState({
        playlistId: selectedPlaylistId,
        songIndex: currentSongIndex,
        track: currentTrack,
        currentTime: audioRef.current?.currentTime || 0,
        volume: volume
      });
    }, 500);
  }, [selectedPlaylistId, currentSongIndex, currentTrack, volume, isRestoring]);

  // Save state when playlist, song, or track changes
  useEffect(() => {
    saveState();
  }, [selectedPlaylistId, currentSongIndex, currentTrack, saveState]);

  // Save state periodically during playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      saveState();
    }, 5000); // Save every 5 seconds while playing

    return () => clearInterval(interval);
  }, [isPlaying, saveState]);

  // Save state when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedPlaylistId && audioRef.current) {
        // Synchronous save on unload
        savePlaybackState({
          playlistId: selectedPlaylistId,
          songIndex: currentSongIndex,
          track: currentTrack,
          currentTime: audioRef.current.currentTime || 0,
          volume: volume
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload(); // Also save on unmount
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedPlaylistId, currentSongIndex, currentTrack, volume]);

  useEffect(() => {
    loadPlaylists();
  }, []);

  // Restore state after playlists are loaded
  useEffect(() => {
    if (!loading && playlists.length > 0 && !hasRestoredState.current) {
      hasRestoredState.current = true;
      const savedState = getPlaybackState();
      if (savedState) {
        restorePlaybackState();
      } else {
        // Default to first playlist
        setSelectedPlaylistId(String(playlists[0].id));
      }
    }
  }, [loading, playlists]);

  const restorePlaybackState = async () => {
    const savedState = getPlaybackState();
    if (!savedState) return;

    // Check if the saved playlist exists
    const playlistExists = playlists.some(p => String(p.id) === String(savedState.playlistId));
    if (!playlistExists) return;

    setIsRestoring(true);

    try {
      // Restore volume
      if (savedState.volume !== undefined) {
        setVolume(savedState.volume);
        if (audioRef.current) {
          audioRef.current.volume = savedState.volume;
        }
      }

      // Set the playlist ID - this will trigger loadPlaylistDetail
      setSelectedPlaylistId(String(savedState.playlistId));

      // Store the rest of state to apply after playlist loads
      setPendingSeekTime({
        songIndex: savedState.songIndex,
        track: savedState.track || 1,
        time: savedState.currentTime || 0,
        autoPlay: autoResume
      });
    } catch (err) {
      console.error('Failed to restore playback state:', err);
      setIsRestoring(false);
    }
  };

  const manualPlaylistLoad = useRef(false);
  useEffect(() => {
    if (selectedPlaylistId && !manualPlaylistLoad.current) {
      loadPlaylistDetail(selectedPlaylistId);
    }
    manualPlaylistLoad.current = false;
  }, [selectedPlaylistId]);

  // Apply pending state after playlist loads
  useEffect(() => {
    if (currentPlaylist && pendingSeekTime && currentPlaylist.songs?.length > 0) {
      const { songIndex, track, time, autoPlay } = pendingSeekTime;

      // Validate song index
      const validIndex = Math.min(songIndex, currentPlaylist.songs.length - 1);
      setCurrentSongIndex(validIndex);
      setCurrentTrack(track);

      // Set up to seek after audio loads
      const handleCanPlay = () => {
        if (audioRef.current && time > 0) {
          audioRef.current.currentTime = time;
        }
        if (autoPlay && audioRef.current) {
          audioRef.current.play().catch(console.error);
        }
        setIsRestoring(false);
        audioRef.current?.removeEventListener('canplay', handleCanPlay);
      };

      if (audioRef.current) {
        audioRef.current.addEventListener('canplay', handleCanPlay, { once: true });
      }

      setPendingSeekTime(null);
    }
  }, [currentPlaylist, pendingSeekTime]);

  useEffect(() => {
    // Update audio src when song or track changes
    if (currentPlaylist && currentPlaylist.songs && currentPlaylist.songs.length > 0) {
      const song = currentPlaylist.songs[currentSongIndex];
      if (song) {
        const url = currentTrack === 1
          ? (song.archived_url_1 || song.download_url_1)
          : (song.archived_url_2 || song.download_url_2);
        trace(`SRC effect: idx=${currentSongIndex} track=${currentTrack} url=${url?.substring(0,60)} isPlaying=${isPlaying} isRestoring=${isRestoring}`);
        if (audioRef.current && url) {
          const resolvedUrl = new URL(url, window.location.origin).href;
          const currentSrc = audioRef.current.src;
          if (currentSrc !== resolvedUrl) {
            trace(`Setting src → ${resolvedUrl.substring(0,80)}...`);
            audioRef.current.src = resolvedUrl;
            audioRef.current.load();
            trace(`load() called. readyState=${audioRef.current.readyState} networkState=${audioRef.current.networkState}`);
          } else {
            trace(`Src unchanged, skipping reload`);
          }
          if (isPlaying && !isRestoring) {
            const playWhenReady = () => {
              trace(`canplay fired! readyState=${audioRef.current.readyState} — calling play()`);
              audioRef.current.play().then(() => {
                trace(`play() resolved OK`);
              }).catch(e => {
                trace(`play() REJECTED: ${e.name}: ${e.message}`);
              });
            };
            if (audioRef.current.readyState >= 3) {
              trace(`readyState already ${audioRef.current.readyState} — playing immediately`);
              audioRef.current.play().then(() => trace('play() OK')).catch(e => trace(`play() ERR: ${e.name}: ${e.message}`));
            } else {
              trace(`readyState=${audioRef.current.readyState} — waiting for canplay`);
              audioRef.current.addEventListener('canplay', playWhenReady, { once: true });
            }
          }
        } else {
          trace(`No audio ref or no URL`);
        }
      }
    }
  }, [currentSongIndex, currentTrack, currentPlaylist, isRestoring, trace]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const data = await getPlaylists();
      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylistDetail = async (playlistId, autoPlay = false) => {
    try {
      const playlist = await getPlaylist(playlistId);
      setCurrentPlaylist(playlist);
      // Only reset if not restoring state
      if (!pendingSeekTime) {
        setCurrentSongIndex(0);
        setCurrentTrack(1);
        setIsPlaying(autoPlay);
      }
    } catch (err) {
      console.error('Failed to load playlist:', err);
    }
  };

  const currentSong = currentPlaylist?.songs?.[currentSongIndex];
  const hasTrack1 = currentSong?.archived_url_1 || currentSong?.download_url_1;
  const hasTrack2 = currentSong?.archived_url_2 || currentSong?.download_url_2;

  // Media Session API — enables lock screen controls and background playback on iOS/Android
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.specific_title || currentSong.title || 'Unknown',
      artist: currentSong.artist || 'AIA Music',
      album: currentPlaylist?.name || 'Playlist',
      artwork: currentSong.image_url ? [{ src: currentSong.image_url, sizes: '512x512', type: 'image/png' }] : [],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      setIsPlaying(true);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (currentSongIndex > 0) {
        setCurrentSongIndex(currentSongIndex - 1);
        setCurrentTrack(1);
        setIsPlaying(true);
      }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const nextIndex = currentSongIndex < currentPlaylist.songs.length - 1 ? currentSongIndex + 1 : 0;
      setCurrentSongIndex(nextIndex);
      setCurrentTrack(1);
      setIsPlaying(true);
    });
  }, [currentSong, currentSongIndex, currentPlaylist]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    trace(`PlayPause clicked. isPlaying=${isPlaying} src=${audioRef.current.src?.substring(0,60)} readyState=${audioRef.current.readyState} networkState=${audioRef.current.networkState}`);

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().then(() => trace('play() from button OK')).catch(e => trace(`play() from button ERR: ${e.name}: ${e.message}`));
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
      setCurrentTrack(1);
    }
  };

  const handleNext = () => {
    if (currentPlaylist && currentSongIndex < currentPlaylist.songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
      setCurrentTrack(1);
    }
  };

  const handleSongSelect = (index) => {
    setCurrentSongIndex(index);
    setCurrentTrack(1);
    setIsPlaying(true);
  };

  const handleTrackToggle = (trackNum) => {
    if ((trackNum === 1 && hasTrack1) || (trackNum === 2 && hasTrack2)) {
      setCurrentTrack(trackNum);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = e.target.value / 100;
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  // Keep a ref to playlist/index so handleEnded can read current values
  // even when called from a native DOM event listener (iOS background)
  const playlistRef = useRef(null);
  const songIndexRef = useRef(0);
  useEffect(() => { playlistRef.current = currentPlaylist; }, [currentPlaylist]);
  useEffect(() => { songIndexRef.current = currentSongIndex; }, [currentSongIndex]);

  const handleEnded = useCallback(() => {
    const playlist = playlistRef.current;
    const idx = songIndexRef.current;
    if (!playlist || !playlist.songs?.length) return;

    const songs = playlist.songs;
    const totalSongs = songs.length;

    // Find next playable song (loop back to 0 at end)
    const findNextPlayable = (startIdx) => {
      for (let i = 0; i < totalSongs; i++) {
        const candidate = (startIdx + i) % totalSongs;
        const s = songs[candidate];
        if (s?.archived_url_1 || s?.download_url_1) return candidate;
      }
      return null;
    };

    const rawNext = (idx + 1) % totalSongs;
    const nextIndex = findNextPlayable(rawNext);
    if (nextIndex === null) { setIsPlaying(false); return; }

    const nextSong = songs[nextIndex];
    const nextUrl = nextSong.archived_url_1 || nextSong.download_url_1;
    const resolvedUrl = new URL(nextUrl, window.location.origin).href;

    // ── Critical: advance audio directly on DOM element ──────────────────
    // iOS throttles React state updates when screen is locked, so we set
    // src/load/play immediately here without waiting for the useEffect cycle.
    if (audioRef.current) {
      audioRef.current.src = resolvedUrl;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }

    // Sync React state for UI (useEffect will see src already matches → no double-play)
    setCurrentSongIndex(nextIndex);
    setCurrentTrack(1);
    setIsPlaying(true);
  }, []); // stable — reads via refs

  // Attach ended listener directly to DOM element (more reliable than React's onEnded on iOS)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [handleEnded]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player-page">
      <TopBar
        onAddSong={() => navigate('/')}
        onManageStyles={null}
        onLogout={onLogout}
        primaryButtonText="Back to Studio"
        secondaryButtonText={null}
        primaryIconType="back"
        showSecondaryIcon={false}
      />

      <main className="player-content">
        <div className="player-header">
          <h1>Music Player</h1>
          <select
            className="playlist-selector"
            value={selectedPlaylistId}
            onChange={(e) => {
              const id = e.target.value;
              manualPlaylistLoad.current = true;
              setSelectedPlaylistId(id);
              if (id) loadPlaylistDetail(id, true);
            }}
          >
            <option value="">Select a playlist...</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name} ({playlist.song_count} songs)
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="player-loading">Loading playlists...</div>
        ) : !selectedPlaylistId ? (
          <div className="player-empty">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <p>Select a playlist to start listening</p>
          </div>
        ) : !currentPlaylist || currentPlaylist.songs?.length === 0 ? (
          <div className="player-empty">
            <p>This playlist has no songs yet.</p>
          </div>
        ) : (
          <div className="player-layout">
            {/* Now Playing Section */}
            <div className="now-playing-section">
              <div className={`now-playing-card ${isPlaying ? 'is-playing' : ''}`}>
                <div className="album-art">
                  <div className="album-art__vinyl" />
                  <div className="album-art__cover">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                </div>

                <div className="song-details">
                  <h2 className="song-title">{currentSong?.specific_title || 'Untitled'}</h2>
                  <p className="song-artist">
                    {currentSong?.creator}
                    {currentSong?.style_name && ` • ${currentSong.style_name}`}
                  </p>
                </div>



                {/* Progress Bar */}
                <div className="progress-section">
                  <span className="time">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    className="progress-bar"
                    min="0"
                    max="100"
                    value={duration ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                  />
                  <span className="time">{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="player-controls">
                  <button
                    className="control-btn"
                    onClick={handlePrevious}
                    disabled={currentSongIndex === 0}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
                    </svg>
                  </button>

                  <button className="control-btn play-btn" onClick={handlePlayPause}>
                    {isPlaying ? (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7L8 5z"/>
                      </svg>
                    )}
                  </button>

                  <button
                    className="control-btn"
                    onClick={handleNext}
                    disabled={!currentPlaylist || currentSongIndex >= currentPlaylist.songs.length - 1}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zm10-12h2v12h-2V6z"/>
                    </svg>
                  </button>
                </div>

                {/* Volume */}
                <div className="volume-section">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                  <input
                    type="range"
                    className="volume-slider"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={handleVolumeChange}
                  />
                </div>

                {/* Lyrics Preview */}
                {currentSong?.specific_lyrics && (
                  <div className="lyrics-preview">
                    <h4>Lyrics</h4>
                    <p>{currentSong.specific_lyrics}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Playlist Section */}
            <div className="playlist-section">
              <h3>{currentPlaylist.name}</h3>
              <div className="playlist-tracks">
                {currentPlaylist.songs.map((song, index) => (
                  <div
                    key={song.id}
                    className={`playlist-track ${index === currentSongIndex ? 'active' : ''} ${!(song.archived_url_1 || song.download_url_1) ? 'unavailable' : ''}`}
                    onClick={() => (song.archived_url_1 || song.download_url_1) && handleSongSelect(index)}
                  >
                    <span className="track-number">
                      {index === currentSongIndex && isPlaying ? (
                        <svg className="playing-indicator" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" className="bar bar-1"/>
                          <rect x="14" y="8" width="4" height="12" className="bar bar-2"/>
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="track-info">
                      <span className="track-title">{song.specific_title || 'Untitled'}</span>
                      <span className="track-artist">{song.creator}</span>
                    </div>
                    {!(song.archived_url_1 || song.download_url_1) && (
                      <span className="track-status">Not Ready</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          handleLoadedMetadata();
          trace(`loadedmetadata: duration=${e.target.duration?.toFixed(1)}s`);
        }}
        onCanPlay={() => trace(`canplay event: readyState=${audioRef.current?.readyState}`)}
        onPlaying={() => trace(`playing event (audio actually started)`)}
        onWaiting={() => trace(`waiting event (buffering stall)`)}
        onStalled={() => trace(`stalled event (download stalled)`)}
        onSuspend={() => trace(`suspend event (download suspended)`)}
        onPlay={() => { trace('play event'); setIsPlaying(true); }}
        onPause={() => { trace('pause event'); setIsPlaying(false); }}
        onError={(e) => {
          const err = e.target.error;
          trace(`ERROR: code=${err?.code} msg=${err?.message}`);
          // Skip broken track — use same direct DOM advance as handleEnded
          handleEnded();
        }}
      />

    </div>
  );
}

export default MusicPlayer;
