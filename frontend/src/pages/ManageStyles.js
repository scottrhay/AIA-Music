import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/Studio/TopBar';
import { getStyles, createStyle, updateStyle, deleteStyle, getStyleSongsCount } from '../services/styles';
import '../theme/theme.css';
import './ManageStyles.css';

function ManageStyles({ onLogout }) {
  const navigate = useNavigate();
  const detailsRef = useRef(null);
  const [styles, setStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    style_prompt: ''
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({ style: null, songsCount: 0 });
  const [reassignTo, setReassignTo] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    try {
      console.time('Load Styles Total');
      setLoading(true);

      console.time('API Call');
      const data = await getStyles();
      console.timeEnd('API Call');

      console.time('State Update');
      setStyles(data.styles || []);
      if (data.styles?.length > 0 && !selectedStyle) {
        setSelectedStyle(data.styles[0]);
      }
      console.timeEnd('State Update');
    } catch (err) {
      console.error('Load styles error:', err);
      setError('Failed to load styles');
    } finally {
      setLoading(false);
      console.timeEnd('Load Styles Total');
    }
  };

  const handleSelectStyle = (style) => {
    setSelectedStyle(style);
    setIsEditing(false);
    setIsCreating(false);
    setError('');

    // Scroll to top of details panel
    if (detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEdit = () => {
    setFormData({
      name: selectedStyle.name,
      style_prompt: selectedStyle.style_prompt || ''
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setFormData({ name: '', style_prompt: '' });
    setIsCreating(true);
    setIsEditing(false);
    setSelectedStyle(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setError('');
    if (styles.length > 0) {
      setSelectedStyle(styles[0]);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Style name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isCreating) {
        const result = await createStyle(formData);
        setStyles([...styles, result.style]);
        setSelectedStyle(result.style);
      } else {
        const result = await updateStyle(selectedStyle.id, formData);
        setStyles(styles.map(s => s.id === selectedStyle.id ? result.style : s));
        setSelectedStyle(result.style);
      }
      setIsEditing(false);
      setIsCreating(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save style');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStyle) return;

    try {
      // First check how many songs use this style
      const countData = await getStyleSongsCount(selectedStyle.id);

      if (countData.count > 0) {
        // Show reassignment modal
        setDeleteInfo({ style: selectedStyle, songsCount: countData.count });
        setReassignTo(0); // Default to "No style"
        setShowDeleteModal(true);
      } else {
        // No songs, confirm and delete directly
        if (window.confirm(`Delete style "${selectedStyle.name}"? This cannot be undone.`)) {
          await performDelete(selectedStyle.id, null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check style usage');
    }
  };

  const performDelete = async (styleId, reassignToId) => {
    setDeleting(true);
    try {
      await deleteStyle(styleId, reassignToId);
      const newStyles = styles.filter(s => s.id !== styleId);
      setStyles(newStyles);
      setSelectedStyle(newStyles.length > 0 ? newStyles[0] : null);
      setShowDeleteModal(false);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete style');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDelete = () => {
    performDelete(deleteInfo.style.id, reassignTo);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteInfo({ style: null, songsCount: 0 });
  };

  // Get styles available for reassignment (exclude the one being deleted)
  const availableStyles = styles.filter(s => s.id !== deleteInfo.style?.id);

  return (
    <div className="manage-styles">
      <TopBar
        onAddSong={handleCreate}
        onManageStyles={null}
        onManageSongs={() => navigate('/')}
        onLogout={onLogout}
        primaryButtonText="New Style"
        primaryButtonIcon="palette"
      />

      <main className="manage-styles__content">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <span className="badge primary">Music Styles</span>
            <span className="badge secondary">{styles.length} styles</span>
          </div>
        </div>

        <p className="section-description">
          Create and manage music styles for your songs. Each style defines the genre, mood, and musical characteristics that Suno will use when generating music.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="styles-layout">
          <div className="styles-sidebar">
            <h3>Available Styles</h3>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="styles-list">
                {styles.map((style) => (
                  <div
                    key={style.id}
                    className={`style-item ${selectedStyle?.id === style.id ? 'active' : ''}`}
                    onClick={() => handleSelectStyle(style)}
                  >
                    <div className="style-item-name">{style.name}</div>
                    <div className="style-item-meta">
                      {style.style_prompt ? `${style.style_prompt.substring(0, 40)}...` : 'No prompt'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="style-details" ref={detailsRef}>
            {isCreating ? (
              <>
                <div className="details-header">
                  <h2>Create New Style</h2>
                </div>
                <div className="details-content">
                  <div className="detail-section">
                    <label>Style Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Upbeat Pop, Chill Acoustic, Epic Cinematic"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div className="detail-section">
                    <label>Style Prompt</label>
                    <textarea
                      value={formData.style_prompt}
                      onChange={(e) => setFormData({ ...formData, style_prompt: e.target.value })}
                      rows="6"
                      placeholder="Describe the musical style, genre, instruments, mood, tempo, etc. Example: 'Genre: upbeat pop with electronic elements. Mood: energetic and positive. Instruments: synths, drums, bass guitar. Tempo: 120 BPM'"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Creating...' : 'Create Style'}
                    </button>
                  </div>
                </div>
              </>
            ) : isEditing ? (
              <>
                <div className="details-header">
                  <h2>Edit Style</h2>
                </div>
                <div className="details-content">
                  <div className="detail-section">
                    <label>Style Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div className="detail-section">
                    <label>Style Prompt</label>
                    <textarea
                      value={formData.style_prompt}
                      onChange={(e) => setFormData({ ...formData, style_prompt: e.target.value })}
                      rows="6"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                    <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                      Delete
                    </button>
                  </div>
                </div>
              </>
            ) : selectedStyle ? (
              <>
                <div className="details-header">
                  <h2>{selectedStyle.name}</h2>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexShrink: 0 }}>
                    <button className="btn btn-secondary" onClick={handleEdit}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="details-content">
                  <div className="detail-section">
                    <h4>Style Prompt</h4>
                    <p style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '6px' }}>
                      {selectedStyle.style_prompt || 'No style prompt defined'}
                    </p>
                  </div>
                  <div className="detail-section">
                    <h4>Details</h4>
                    <p><strong>Created by:</strong> {selectedStyle.created_by || 'Unknown'}</p>
                    <p><strong>Created:</strong> {selectedStyle.created_at ? new Date(selectedStyle.created_at).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>Select a style to view details, or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal with Reassignment */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Style</h2>
              <button className="modal-close" onClick={handleCancelDelete}>×</button>
            </div>
            <div className="modal-body">
              <p>
                The style <strong>"{deleteInfo.style?.name}"</strong> is used by{' '}
                <strong>{deleteInfo.songsCount} song{deleteInfo.songsCount !== 1 ? 's' : ''}</strong>.
              </p>
              <p>Choose which style to assign these songs to:</p>

              <div className="reassign-select-wrapper">
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(parseInt(e.target.value))}
                  className="reassign-select"
                >
                  <option value={0}>No style (remove style from songs)</option>
                  {availableStyles.map(style => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Style'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageStyles;
