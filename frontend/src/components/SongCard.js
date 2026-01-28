import React, { useState, useRef, useEffect } from 'react';
import StarRating from './StarRating';
import './SongCard.css';

function SongCard({ song, onView, onDelete, onDuplicate, onUpdateTitle, onRatingChange }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(song.specific_title || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  const getStatusClass = (status) => {
    switch (status) {
      case 'create':
        return 'status-create';
      case 'submitted':
        return 'status-submitted';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-unspecified';
    }
  };

  const getStatusLabel = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unspecified';
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return 'No lyrics provided';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    setEditedTitle(song.specific_title || '');
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (editedTitle !== song.specific_title && onUpdateTitle) {
      await onUpdateTitle(song.id, editedTitle);
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

  return (
    <div className="song-card" onClick={() => onView(song)}>
      <div className="song-card-header">
        <div className="song-icon">♫</div>
        <div className="header-right">
          {song.status === 'submitted' && (
            <span className="status-badge status-submitted">Generating...</span>
          )}
          {song.status === 'failed' && (
            <span className="status-badge status-failed">Failed</span>
          )}
          <div className="card-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-btn icon-duplicate"
              onClick={() => onDuplicate(song)}
              title="Duplicate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button
              className="icon-btn icon-delete"
              onClick={() => onDelete(song.id)}
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="song-card-body">
        <h3 className="song-title" onClick={handleTitleClick}>
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="title-edit-input"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            song.specific_title || 'Untitled Song'
          )}
        </h3>

        <p className="song-lyrics">{truncateText(song.specific_lyrics)}</p>

        {/* Show large play button for completed songs */}
        {song.status === 'completed' && (song.download_url || song.download_url_1 || song.archived_url) && (
          <div className="song-audio-section" onClick={(e) => e.stopPropagation()}>
            <button className={`song-play-button ${isPlaying ? 'playing' : ''}`} onClick={handlePlayPause}>
              {isPlaying ? (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                  <span className="play-text">Pause</span>
                </>
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5z"/>
                  </svg>
                  <span className="play-text">
                    {song.track_number && song.sibling_group_id ? `Play Variation ${song.track_number}` : 'Play Track'}
                  </span>
                </>
              )}
            </button>

            <a
              href={song.archived_url || song.download_url || song.download_url_1}
              download
              className="song-download-link"
              title="Download"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </a>

            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src={song.archived_url || song.download_url || song.download_url_1}
              preload="metadata"
              onEnded={handleAudioEnded}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Star Rating */}
        {song.status === 'completed' && (
          <div className="song-rating" onClick={(e) => e.stopPropagation()}>
            <StarRating
              rating={song.star_rating || 0}
              onRatingChange={(rating) => onRatingChange && onRatingChange(song.id, rating)}
              size="small"
            />
          </div>
        )}

        <div className="song-meta">
          {song.creator && (
            <div className="meta-item">
              <span className="meta-label">Creator:</span>
              <span className="meta-value">{song.creator}</span>
            </div>
          )}
          {song.style_name && (
            <div className="meta-item">
              <span className="meta-label">Style:</span>
              <span className="meta-value">{song.style_name}</span>
            </div>
          )}
          {song.vocal_gender && (
            <div className="meta-item">
              <span className="meta-label">Vocal:</span>
              <span className="meta-value">
                {song.vocal_gender.charAt(0).toUpperCase() + song.vocal_gender.slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SongCard;
