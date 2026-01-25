import React, { useState, useRef, useEffect, memo } from 'react';
import './TrackCard.css';
import StarRating from '../StarRating';
import { updateSongRating, updateSong } from '../../services/songs';

// Calculate generation progress and stage based on elapsed time
function getGenerationProgress(startTime) {
  if (!startTime) return { progress: 10, stage: 'Composing...' };

  const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000; // seconds

  if (elapsed < 30) {
    // 0-30s: 10-40% "Composing..."
    const progress = 10 + (elapsed / 30) * 30;
    return { progress: Math.min(progress, 40), stage: 'Composing...' };
  } else if (elapsed < 90) {
    // 30-90s: 40-70% "Arranging..."
    const progress = 40 + ((elapsed - 30) / 60) * 30;
    return { progress: Math.min(progress, 70), stage: 'Arranging...' };
  } else if (elapsed < 180) {
    // 90-180s: 70-90% "Mixing & mastering..."
    const progress = 70 + ((elapsed - 90) / 90) * 20;
    return { progress: Math.min(progress, 90), stage: 'Mixing & mastering...' };
  } else {
    // 180s+: 90-95% "Finishing touches..." (never hits 100%)
    const progress = 90 + Math.min((elapsed - 180) / 120, 1) * 5;
    return { progress: Math.min(progress, 95), stage: 'Finishing touches...' };
  }
}

function TrackCard({ song, onView, onDelete, onDuplicate, onEdit, onRatingChange, isPlaying, onAssignPlaylist, lastCheckedAt }) {
  const [showMenu, setShowMenu] = useState(false);
  const [rating, setRating] = useState(song.star_rating || 0);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [generationProgress, setGenerationProgress] = useState({ progress: 10, stage: 'Composing...' });
  const [lastCheckedAgo, setLastCheckedAgo] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(song.specific_title || '');
  const audioRef1 = useRef(null);
  const audioRef2 = useRef(null);

  // Check if song is generating
  const isGenerating = song.status === 'submitted' || (song.status === 'completed' && !song.download_url_1 && !song.download_url_2 && !song.archived_url_1 && !song.archived_url_2);

  // Update progress every second for generating songs
  useEffect(() => {
    if (!isGenerating) return;

    // Use submitted_at from song, or fall back to created_at, or current time
    const startTime = song.submitted_at || song.created_at || new Date().toISOString();

    // Initial calculation
    setGenerationProgress(getGenerationProgress(startTime));

    // Update every second
    const interval = setInterval(() => {
      setGenerationProgress(getGenerationProgress(startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating, song.submitted_at, song.created_at]);

  // Update "last checked" display
  useEffect(() => {
    if (!isGenerating || !lastCheckedAt) {
      setLastCheckedAgo('');
      return;
    }

    const updateLastChecked = () => {
      const seconds = Math.floor((Date.now() - lastCheckedAt) / 1000);
      if (seconds < 5) {
        setLastCheckedAgo('just now');
      } else if (seconds < 60) {
        setLastCheckedAgo(`${seconds}s ago`);
      } else {
        setLastCheckedAgo(`${Math.floor(seconds / 60)}m ago`);
      }
    };

    updateLastChecked();
    const interval = setInterval(updateLastChecked, 1000);
    return () => clearInterval(interval);
  }, [isGenerating, lastCheckedAt]);

  const handleDownload = async (url, filename, trackNumber) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Mark as downloaded in database
      try {
        const updateData = trackNumber === 1
          ? { downloaded_url_1: true }
          : { downloaded_url_2: true };
        await updateSong(song.id, updateData);
      } catch (error) {
        console.error('Failed to mark as downloaded:', error);
      }
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const truncateToLines = (text, maxLines = 2) => {
    if (!text) return null;
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length <= maxLines) return lines.join('\n');
    return lines.slice(0, maxLines).join('\n') + '...';
  };

  const hasAudio = song.status === 'completed' && (song.download_url_1 || song.download_url_2 || song.archived_url_1 || song.archived_url_2);

  const getStatusInfo = (status) => {
    if (status === 'completed' && !hasAudio) {
      return { label: 'Generating', className: 'status-generating' };
    }
    const statuses = {
      'completed': { label: 'Ready', className: 'status-ready' },
      'submitted': { label: 'Generating', className: 'status-generating' },
      'create': { label: 'Draft', className: 'status-draft' },
      'failed': { label: 'Failed', className: 'status-failed' },
    };
    return statuses[status] || { label: 'Unknown', className: 'status-unknown' };
  };

  const statusInfo = getStatusInfo(song.status);

  const handleCardClick = () => {
    onView(song);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  const handleRatingChange = async (newRating) => {
    try {
      setRating(newRating);
      await updateSongRating(song.id, newRating);
      if (onRatingChange) {
        onRatingChange(song.id, newRating);
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
      setRating(song.star_rating || 0);
    }
  };

  const handlePlayTrack = (e, trackNum) => {
    e.stopPropagation();
    const audioRef = trackNum === 1 ? audioRef1 : audioRef2;
    const otherAudioRef = trackNum === 1 ? audioRef2 : audioRef1;

    if (otherAudioRef.current) {
      otherAudioRef.current.pause();
    }

    if (audioRef.current) {
      if (playingTrack === trackNum) {
        audioRef.current.pause();
        setPlayingTrack(null);
      } else {
        audioRef.current.play().catch(console.error);
        setPlayingTrack(trackNum);
      }
    }
  };

  const handleAudioEnded = (trackNum) => {
    if (playingTrack === trackNum) {
      setPlayingTrack(null);
    }
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    setEditedTitle(song.specific_title || '');
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (editedTitle !== song.specific_title) {
      try {
        await updateSong(song.id, { specific_title: editedTitle });
        song.specific_title = editedTitle;
      } catch (error) {
        console.error('Failed to update title:', error);
        setEditedTitle(song.specific_title || '');
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(song.specific_title || '');
      setIsEditingTitle(false);
    }
  };

  const lyricsPreview = truncateToLines(song.specific_lyrics, 2);

  return (
    <div
      className={`track-card ${isPlaying ? 'track-card--playing' : ''}`}
      onClick={handleCardClick}
    >
      {/* Header Row */}
      <div className="track-card__header">
        <div className="track-card__title-section">
          <h3 className="track-card__title" onClick={handleTitleClick}>
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="track-card__title-input"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              song.specific_title || 'Untitled Song'
            )}
          </h3>
          {!isEditingTitle && song.version && <span className="track-card__version">{song.version}</span>}

          {/* Status badge for non-ready songs */}
          {(song.status !== 'completed' || !hasAudio) && !isGenerating && (
            <span className={`track-card__status ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

        <div className="track-card__actions">
          <div className="track-card__rating" onClick={(e) => e.stopPropagation()}>
            <StarRating rating={rating} onRatingChange={handleRatingChange} size="small" />
          </div>

          <div className="menu-container">
            <button className="action-btn" onClick={handleMenuClick} aria-label="More actions">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="2" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="19" r="2" fill="currentColor"/>
              </svg>
            </button>

            {showMenu && (
              <div className="menu-dropdown">
                {onAssignPlaylist && (
                  <button className="menu-item" onClick={(e) => handleActionClick(e, () => onAssignPlaylist(song))}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Add to Playlist</span>
                  </button>
                )}
                {onEdit && song.source_type === 'uploaded' && (
                  <button className="menu-item" onClick={(e) => handleActionClick(e, () => onEdit(song))}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Edit</span>
                  </button>
                )}
                <button className="menu-item" onClick={(e) => handleActionClick(e, () => onDuplicate(song))}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>Duplicate</span>
                </button>
                <button className="menu-item menu-item--danger" onClick={(e) => handleActionClick(e, () => onDelete(song.id))}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Style info */}
      {song.style_name && (
        <div className="track-card__meta">{song.style_name}</div>
      )}

      {/* Lyrics Preview - max 2 lines */}
      {lyricsPreview && (
        <p className="track-card__lyrics">{lyricsPreview}</p>
      )}

      {/* Generation Progress Bar */}
      {isGenerating && (
        <div className="generation-progress">
          <div className="generation-progress__header">
            <span className="generation-progress__stage">{generationProgress.stage}</span>
            <span className="generation-progress__percent">{Math.round(generationProgress.progress)}%</span>
          </div>
          <div className="generation-progress__bar">
            <div
              className="generation-progress__fill"
              style={{ width: `${generationProgress.progress}%` }}
            />
          </div>
          {lastCheckedAgo && (
            <div className="generation-progress__footer">
              <span className="generation-progress__spinner"></span>
              <span>Checked {lastCheckedAgo}</span>
            </div>
          )}
        </div>
      )}

      {/* Track Rows - only show if has audio */}
      {hasAudio && (
        <div className="track-card__tracks" onClick={(e) => e.stopPropagation()}>
          {(song.download_url_1 || song.archived_url_1) && (
            <TrackRow
              trackNum={1}
              isPlaying={playingTrack === 1}
              onPlay={(e) => handlePlayTrack(e, 1)}
              onDownload={() => handleDownload(
                song.archived_url_1 || song.download_url_1,
                `${(song.specific_title || 'song').replace(/[/\\?%*:|"<>]/g, '-')}_1_${song.version || 'v1'}.mp3`,
                1
              )}
              isDownloaded={song.downloaded_url_1}
              playlists={song.playlists}
              onAssignPlaylist={() => onAssignPlaylist && onAssignPlaylist(song)}
            />
          )}
          {(song.download_url_2 || song.archived_url_2) && (
            <TrackRow
              trackNum={2}
              isPlaying={playingTrack === 2}
              onPlay={(e) => handlePlayTrack(e, 2)}
              onDownload={() => handleDownload(
                song.archived_url_2 || song.download_url_2,
                `${(song.specific_title || 'song').replace(/[/\\?%*:|"<>]/g, '-')}_2_${song.version || 'v1'}.mp3`,
                2
              )}
              isDownloaded={song.downloaded_url_2}
              playlists={song.playlists}
              onAssignPlaylist={() => onAssignPlaylist && onAssignPlaylist(song)}
            />
          )}

          {/* Hidden audio elements - prefer archived URLs */}
          <audio ref={audioRef1} src={song.archived_url_1 || song.download_url_1} onEnded={() => handleAudioEnded(1)} style={{ display: 'none' }} />
          <audio ref={audioRef2} src={song.archived_url_2 || song.download_url_2} onEnded={() => handleAudioEnded(2)} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
}

// Individual Track Row Component
function TrackRow({ trackNum, isPlaying, onPlay, onDownload, isDownloaded, playlists, onAssignPlaylist }) {
  const hasPlaylist = playlists && playlists.length > 0;
  const playlistNames = hasPlaylist ? playlists.map(p => p.name).join(', ') : '';

  return (
    <div className="track-row">
      {/* Play Button */}
      <button className={`track-row__play ${isPlaying ? 'playing' : ''}`} onClick={onPlay}>
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z"/>
          </svg>
        )}
      </button>

      {/* Track Name */}
      <span className="track-row__name">Track {trackNum}</span>

      {/* Playlist Indicator */}
      <button
        className={`track-row__playlist ${hasPlaylist ? 'in-list' : ''}`}
        onClick={onAssignPlaylist}
        title={hasPlaylist ? `In: ${playlistNames}` : 'Add to playlist'}
      >
        {hasPlaylist ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{playlists.length === 1 ? playlists[0].name : `${playlists.length} lists`}</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span>+ Playlist</span>
          </>
        )}
      </button>

      {/* Download Button */}
      <button
        className={`track-row__download ${!isDownloaded ? 'not-downloaded' : ''}`}
        onClick={(e) => { e.stopPropagation(); onDownload(); }}
        title={isDownloaded ? 'Downloaded' : 'Download'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    </div>
  );
}

export default memo(TrackCard);
