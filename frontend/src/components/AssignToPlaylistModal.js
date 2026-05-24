import React, { useState, useEffect } from 'react';
import { getSongPlaylists, assignSongToPlaylists, createPlaylist } from '../services/playlists';
import './SongModal.css';
import './AssignToPlaylistModal.css';

function AssignToPlaylistModal({ song, onClose }) {
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, [song.id]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const data = await getSongPlaylists(song.id);
      setUserPlaylists(data.user_playlists || []);
      setSelectedPlaylists(data.song_playlist_ids || []);
    } catch (err) {
      console.error('Failed to load playlists:', err);
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlaylist = (playlistId) => {
    setSelectedPlaylists(prev => {
      if (prev.includes(playlistId)) {
        return prev.filter(id => id !== playlistId);
      } else {
        return [...prev, playlistId];
      }
    });
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const result = await createPlaylist({ name: newPlaylistName.trim() });
      const newPlaylist = result.playlist;
      setUserPlaylists(prev => [...prev, newPlaylist]);
      setSelectedPlaylists(prev => [...prev, newPlaylist.id]);
      setNewPlaylistName('');
      setShowNewPlaylist(false);
    } catch (err) {
      console.error('Failed to create playlist:', err);
      setError('Failed to create playlist');
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
      await assignSongToPlaylists(song.id, selectedPlaylists);
      onClose(true);
    } catch (err) {
      console.error('Failed to assign playlists:', err);
      setError(err.response?.data?.error || 'Failed to update playlist assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !saving) {
      onClose(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content assign-playlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to Playlist</h2>
          <button className="modal-close" onClick={() => onClose(false)}>
            ×
          </button>
        </div>

        <div className="assign-playlist-body">
          <p className="song-title-label">
            <strong>{song.specific_title || 'Untitled Song'}</strong>
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-state">Loading playlists...</div>
          ) : (
            <>
              {userPlaylists.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't created any playlists yet.</p>
                </div>
              ) : (
                <div className="playlist-checkbox-list">
                  {userPlaylists.map(playlist => (
                    <label key={playlist.id} className="playlist-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedPlaylists.includes(playlist.id)}
                        onChange={() => handleTogglePlaylist(playlist.id)}
                      />
                      <span className="playlist-name">{playlist.name}</span>
                      <span className="playlist-count">{playlist.song_count} songs</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="new-playlist-section">
                {showNewPlaylist ? (
                  <div className="new-playlist-form">
                    <input
                      type="text"
                      placeholder="New playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setShowNewPlaylist(false);
                        setNewPlaylistName('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-link create-playlist-btn"
                    onClick={() => setShowNewPlaylist(true)}
                  >
                    + Create New Playlist
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onClose(false)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignToPlaylistModal;
