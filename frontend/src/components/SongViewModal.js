import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './SongViewModal.css';

function SongViewModal({ song, onClose, onDuplicate, onEdit, onSongUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedOwnerId, setEditedOwnerId] = useState(null);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (song) {
      setEditedTitle(song.specific_title || '');
      setEditedOwnerId(song.user_id);
    }
  }, [song]);

  useEffect(() => {
    // Fetch users when entering edit mode
    if (isEditing && users.length === 0) {
      api.get('/auth/users')
        .then(response => {
          setUsers(response.data.users || []);
        })
        .catch(err => {
          console.error('Failed to fetch users:', err);
        });
    }
  }, [isEditing, users.length]);

  if (!song) return null;

  const handleDuplicate = () => {
    onDuplicate(song);
    onClose();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(song);
      onClose();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const updates = {};
      if (editedTitle !== song.specific_title) {
        updates.specific_title = editedTitle;
      }
      if (editedOwnerId !== song.user_id) {
        updates.user_id = editedOwnerId;
      }

      if (Object.keys(updates).length > 0) {
        const response = await api.put(`/songs/${song.id}`, updates);
        if (onSongUpdated) {
          onSongUpdated(response.data.song);
        }
      }

      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(song.specific_title || '');
    setEditedOwnerId(song.user_id);
    setIsEditing(false);
    setError('');
  };

  const isUploadedSong = song.source_type === 'uploaded';

  const handleDownload = async (url, filename) => {
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

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="edit-title-input"
                placeholder="Song title"
                autoFocus
              />
            ) : (
              <>
                {song.specific_title || 'Untitled Song'}
                {song.version && <span className="song-version-badge">{song.version}</span>}
              </>
            )}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="view-modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          {isEditing && (
            <div className="view-section">
              <label className="view-label">Owner</label>
              <select
                value={editedOwnerId || ''}
                onChange={(e) => setEditedOwnerId(parseInt(e.target.value))}
                className="edit-owner-select"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="view-row">
            {song.style_name && (
              <div className="view-section">
                <label className="view-label">Style</label>
                <div className="view-value">{song.style_name}</div>
              </div>
            )}

            {song.vocal_gender && (
              <div className="view-section">
                <label className="view-label">Vocal Gender</label>
                <div className="view-value">
                  {song.vocal_gender.charAt(0).toUpperCase() + song.vocal_gender.slice(1)}
                </div>
              </div>
            )}
          </div>

          {song.specific_lyrics && (
            <div className="view-section">
              <label className="view-label">Lyrics</label>
              <div className="view-value lyrics-content">{song.specific_lyrics}</div>
            </div>
          )}

          {song.prompt_to_generate && (
            <div className="view-section">
              <label className="view-label">Prompt to Generate</label>
              <div className="view-value">{song.prompt_to_generate}</div>
            </div>
          )}

          {!isEditing && song.creator && (
            <div className="view-section">
              <label className="view-label">Creator</label>
              <div className="view-value">{song.creator}</div>
            </div>
          )}

          {(song.archived_url_1 || song.download_url_1 || song.archived_url_2 || song.download_url_2) && (
            <div className="view-section">
              <label className="view-label">Audio</label>
              <div className="audio-players">
                {(song.archived_url_1 || song.download_url_1) && (
                  <div className="audio-track">
                    <div className="audio-header">
                      <span className="track-label">Version 1</span>
                      <button
                        className="download-link-icon"
                        title="Download Version 1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(
                            song.archived_url_1 || song.download_url_1,
                            `${(song.specific_title || 'song').replace(/[/\\?%*:|"<>]/g, '-')}_1_${song.version || 'v1'}.mp3`
                          );
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    <audio controls className="audio-player" style={{ width: '100%' }}>
                      <source src={song.archived_url_1 || song.download_url_1} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                {(song.archived_url_2 || song.download_url_2) && (
                  <div className="audio-track">
                    <div className="audio-header">
                      <span className="track-label">Version 2</span>
                      <button
                        className="download-link-icon"
                        title="Download Version 2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(
                            song.archived_url_2 || song.download_url_2,
                            `${(song.specific_title || 'song').replace(/[/\\?%*:|"<>]/g, '-')}_2_${song.version || 'v1'}.mp3`
                          );
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    <audio controls className="audio-player" style={{ width: '100%' }}>
                      <source src={song.archived_url_2 || song.download_url_2} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              {isUploadedSong && onEdit && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEdit}
                >
                  Full Edit
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDuplicate}
              >
                Duplicate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SongViewModal;
