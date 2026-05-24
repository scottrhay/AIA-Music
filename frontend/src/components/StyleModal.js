import React, { useState, useEffect } from 'react';
import { createStyle, updateStyle } from '../services/styles';
import './SongModal.css';

function StyleModal({ style, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    style_prompt: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (style) {
      // Build style_prompt from individual fields if they exist (for backward compatibility)
      let prompt = style.style_prompt || '';
      if (!prompt && (style.genre || style.beat || style.mood || style.vocals || style.instrumentation)) {
        const parts = [];
        if (style.genre) parts.push(style.genre);
        if (style.beat) parts.push(style.beat);
        if (style.mood) parts.push(style.mood);
        if (style.vocals) parts.push(style.vocals);
        if (style.instrumentation) parts.push(style.instrumentation);
        prompt = parts.join(', ');
      }

      setFormData({
        name: style.name || '',
        style_prompt: prompt,
      });
    }
  }, [style]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Style name is required');
      return;
    }

    setSaving(true);

    try {
      if (style && style.id) {
        console.log('Updating style:', style.id, formData);
        await updateStyle(style.id, formData);
      } else {
        console.log('Creating style:', formData);
        await createStyle(formData);
      }

      onClose(true); // true = refresh the list
    } catch (err) {
      console.error('Style save error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save style';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not bubbled events
    if (e.target === e.currentTarget && !saving) {
      onClose(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{style ? 'Edit Style' : 'Add New Style'}</h2>
          <button className="modal-close" onClick={() => onClose(false)}>
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Style Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Matt Dubb x TRON Hybrid"
              required
            />
          </div>

          <div className="form-group">
            <label>Style Prompt (max 1000 characters)</label>
            <textarea
              name="style_prompt"
              value={formData.style_prompt}
              onChange={handleChange}
              rows="8"
              maxLength="1000"
              placeholder="Enter the full style prompt. Example:&#10;&#10;EDM pop with Jewish dance influence and futuristic TRON-style synthwave elements, upbeat festival rhythm with punchy 4-on-the-floor kick, energetic and inspiring, melodic male pop vocal with catchy chorus, bright supersaws, neon plucks, glassy arps, deep cyber bass"
            />
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              {formData.style_prompt.length}/1000 characters
            </div>
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
              {saving ? 'Saving...' : style ? 'Update Style' : 'Create Style'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StyleModal;
