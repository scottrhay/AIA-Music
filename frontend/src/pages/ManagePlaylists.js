import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/Studio/TopBar';
import PlaylistModal from '../components/PlaylistModal';
import { getPlaylists, getPlaylist, deletePlaylist, removeSongFromPlaylist } from '../services/playlists';
import '../theme/theme.css';
import './ManageStyles.css';
import './ManagePlaylists.css';

function ManagePlaylists({ onLogout, currentUserId }) {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistDetail, setSelectedPlaylistDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      loadPlaylistDetail(selectedPlaylist.id);
    } else {
      setSelectedPlaylistDetail(null);
    }
  }, [selectedPlaylist]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const data = await getPlaylists();
      setPlaylists(data.playlists || []);
      if (data.playlists && data.playlists.length > 0 && !selectedPlaylist) {
        setSelectedPlaylist(data.playlists[0]);
      }
    } catch (err) {
      console.error('Failed to load playlists:', err);
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylistDetail = async (playlistId) => {
    try {
      setLoadingDetail(true);
      const playlist = await getPlaylist(playlistId);
      setSelectedPlaylistDetail(playlist);
    } catch (err) {
      console.error('Failed to load playlist detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreatePlaylist = () => {
    setEditingPlaylist(null);
    setShowModal(true);
  };

  const handleEditPlaylist = () => {
    if (selectedPlaylistDetail) {
      setEditingPlaylist(selectedPlaylistDetail);
      setShowModal(true);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylist) return;

    if (!window.confirm(`Are you sure you want to delete "${selectedPlaylist.name}"?`)) {
      return;
    }

    try {
      await deletePlaylist(selectedPlaylist.id);
      setSelectedPlaylist(null);
      setSelectedPlaylistDetail(null);
      await loadPlaylists();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      setError(err.response?.data?.error || 'Failed to delete playlist');
    }
  };

  const handleRemoveSong = async (songId) => {
    if (!selectedPlaylist) return;

    try {
      await removeSongFromPlaylist(selectedPlaylist.id, songId);
      await loadPlaylistDetail(selectedPlaylist.id);
      // Also refresh the playlists list to update song counts
      await loadPlaylists();
    } catch (err) {
      console.error('Failed to remove song:', err);
      setError(err.response?.data?.error || 'Failed to remove song');
    }
  };

  const handleModalClose = async (refresh) => {
    setShowModal(false);
    setEditingPlaylist(null);
    if (refresh) {
      await loadPlaylists();
      if (selectedPlaylist) {
        await loadPlaylistDetail(selectedPlaylist.id);
      }
    }
  };

  const isOwner = selectedPlaylistDetail &&
    currentUserId &&
    selectedPlaylistDetail.created_by_id === currentUserId;

  // Separate playlists into user's own and others'
  const myPlaylists = playlists.filter(p => p.created_by_id === currentUserId);
  const otherPlaylists = playlists.filter(p => p.created_by_id !== currentUserId);

  return (
    <div className="manage-styles">
      <TopBar
        onAddSong={() => navigate('/')}
        onManageStyles={null}
        onLogout={onLogout}
        primaryButtonText="Back to Studio"
        secondaryButtonText={null}
        primaryIconType="back"
        showSecondaryIcon={false}
      />

      <main className="manage-styles__content">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <span className="badge primary">Playlists</span>
            <span className="badge secondary">{playlists.length} playlists</span>
          </div>
          <button className="btn btn-primary" onClick={handleCreatePlaylist}>
            + New Playlist
          </button>
        </div>

        <p className="section-description">
          Create and manage your playlists. Add songs to playlists from the song cards in the studio.
          You can also view other users' public playlists.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-4)' }}>
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading playlists...</div>
        ) : playlists.length === 0 ? (
          <div className="empty-state">
            <p>No playlists yet. Create your first playlist to organize your songs!</p>
            <button className="btn btn-primary" onClick={handleCreatePlaylist}>
              Create Playlist
            </button>
          </div>
        ) : (
          <div className="styles-layout">
            <div className="styles-sidebar">
              {myPlaylists.length > 0 && (
                <>
                  <h3>My Playlists</h3>
                  <div className="styles-list">
                    {myPlaylists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className={`style-item ${selectedPlaylist?.id === playlist.id ? 'active' : ''}`}
                        onClick={() => setSelectedPlaylist(playlist)}
                      >
                        <div className="style-item-name">{playlist.name}</div>
                        <div className="style-item-meta">{playlist.song_count} songs</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {otherPlaylists.length > 0 && (
                <>
                  <h3 style={{ marginTop: myPlaylists.length > 0 ? 'var(--spacing-5)' : 0 }}>Other Playlists</h3>
                  <div className="styles-list">
                    {otherPlaylists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className={`style-item ${selectedPlaylist?.id === playlist.id ? 'active' : ''}`}
                        onClick={() => setSelectedPlaylist(playlist)}
                      >
                        <div className="style-item-name">
                          {playlist.name}
                          <span className="readonly-badge">Read Only</span>
                        </div>
                        <div className="style-item-meta">{playlist.song_count} songs</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="style-details">
              {loadingDetail ? (
                <div className="loading">Loading playlist...</div>
              ) : selectedPlaylistDetail ? (
                <>
                  <div className="details-header">
                    <div>
                      <h2>{selectedPlaylistDetail.name}</h2>
                      {selectedPlaylistDetail.created_by && (
                        <p className="playlist-creator">by {selectedPlaylistDetail.created_by}</p>
                      )}
                    </div>
                    {isOwner && (
                      <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button className="btn btn-secondary" onClick={handleEditPlaylist}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={handleDeletePlaylist}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="details-content">
                    {selectedPlaylistDetail.description && (
                      <div className="detail-section">
                        <h4>Description</h4>
                        <p>{selectedPlaylistDetail.description}</p>
                      </div>
                    )}

                    <div className="detail-section">
                      <h4>Songs ({selectedPlaylistDetail.songs?.length || 0})</h4>
                      {selectedPlaylistDetail.songs && selectedPlaylistDetail.songs.length > 0 ? (
                        <div className="playlist-songs">
                          {selectedPlaylistDetail.songs.map((song, index) => (
                            <div key={song.id} className="playlist-song-item">
                              <span className="song-number">{index + 1}</span>
                              <div className="song-info">
                                <span className="song-title">{song.specific_title || 'Untitled'}</span>
                                <span className="song-meta">
                                  {song.creator && <span>{song.creator}</span>}
                                  {song.style_name && <span> • {song.style_name}</span>}
                                </span>
                              </div>
                              {song.download_url_1 && (
                                <span className="song-status ready">Ready</span>
                              )}
                              {isOwner && (
                                <button
                                  className="btn btn-icon btn-remove"
                                  onClick={() => handleRemoveSong(song.id)}
                                  title="Remove from playlist"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-songs">No songs in this playlist yet.</p>
                      )}
                    </div>

                    <div className="detail-section meta">
                      <small>
                        Created: {new Date(selectedPlaylistDetail.created_at).toLocaleDateString()}
                        {selectedPlaylistDetail.is_public ? ' • Public' : ' • Private'}
                      </small>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <p>Select a playlist to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <PlaylistModal
          playlist={editingPlaylist}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default ManagePlaylists;
