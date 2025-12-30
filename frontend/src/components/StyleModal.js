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
      setFormData({
        name: style.name || '',
        style_prompt: style.style_prompt || '',
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
      if (style) {
        await updateStyle(style.id, formData);
      } else {
        await createStyle(formData);
      }

      onClose(true); // true = refresh the list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save style');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
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
            <label>Style Prompt</label>
            <textarea
              name="style_prompt"
              value={formData.style_prompt}
              onChange={handleChange}
              rows="8"
              placeholder="Enter the full Suno prompt for this style. Example:&#10;&#10;EDM pop with Jewish dance influence and futuristic TRON-style synthwave elements, upbeat festival rhythm with punchy 4-on-the-floor kick, energetic and inspiring, melodic male pop vocal with catchy chorus, bright supersaws, neon plucks, glassy arps, deep cyber bass"
            />
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
