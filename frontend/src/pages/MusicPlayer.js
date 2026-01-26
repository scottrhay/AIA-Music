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
      restorePlaybackState();
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

  useEffect(() => {
    if (selectedPlaylistId) {
      loadPlaylistDetail(selectedPlaylistId);
    }
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
        if (audioRef.current && url) {
          // Only update src if URL changed to avoid unnecessary metadata reload
          if (audioRef.current.src !== url) {
            audioRef.current.src = url;
          }
          if (isPlaying && !isRestoring) {
            audioRef.current.play().catch(console.error);
          }
        }
      }
    }
  }, [currentSongIndex, currentTrack, currentPlaylist, isRestoring]);

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

  const loadPlaylistDetail = async (playlistId) => {
    try {
      const playlist = await getPlaylist(playlistId);
      setCurrentPlaylist(playlist);
      // Only reset if not restoring state
      if (!pendingSeekTime) {
        setCurrentSongIndex(0);
        setCurrentTrack(1);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Failed to load playlist:', err);
    }
  };

  const currentSong = currentPlaylist?.songs?.[currentSongIndex];
  const hasTrack1 = currentSong?.archived_url_1 || currentSong?.download_url_1;
  const hasTrack2 = currentSong?.archived_url_2 || currentSong?.download_url_2;

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
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

  const handleEnded = () => {
    // Auto-advance to next song
    if (currentPlaylist && currentSongIndex < currentPlaylist.songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
      setCurrentTrack(1);
      // isPlaying is already true, useEffect will handle play() when src updates
    } else {
      setIsPlaying(false);
    }
  };

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
            onChange={(e) => setSelectedPlaylistId(e.target.value)}
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

                {/* Track Toggle */}
                <div className="track-toggle">
                  <button
                    className={`track-btn ${currentTrack === 1 ? 'active' : ''} ${!hasTrack1 ? 'disabled' : ''}`}
                    onClick={() => handleTrackToggle(1)}
                    disabled={!hasTrack1}
                  >
                    Track 1
                  </button>
                  <button
                    className={`track-btn ${currentTrack === 2 ? 'active' : ''} ${!hasTrack2 ? 'disabled' : ''}`}
                    onClick={() => handleTrackToggle(2)}
                    disabled={!hasTrack2}
                  >
                    Track 2
                  </button>
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
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}

export default MusicPlayer;
