import React, { useState, useEffect } from 'react';
import { createPlaylist, updatePlaylist } from '../services/playlists';
import './SongModal.css';

function PlaylistModal({ playlist, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (playlist) {
      setFormData({
        name: playlist.name || '',
        description: playlist.description || '',
        is_public: playlist.is_public !== false,
      });
    }
  }, [playlist]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Playlist name is required');
      return;
    }

    setSaving(true);

    try {
      if (playlist && playlist.id) {
        await updatePlaylist(playlist.id, formData);
      } else {
        await createPlaylist(formData);
      }

      onClose(true); // true = refresh the list
    } catch (err) {
      console.error('Playlist save error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save playlist';
      setError(errorMessage);
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{playlist ? 'Edit Playlist' : 'Create New Playlist'}</h2>
          <button className="modal-close" onClick={() => onClose(false)}>
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Playlist Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., My Favorites"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Optional description for this playlist"
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              <span>Public playlist (visible to other users)</span>
            </label>
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : playlist ? 'Update Playlist' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlaylistModal;
