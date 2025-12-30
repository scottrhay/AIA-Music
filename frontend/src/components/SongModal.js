import React, { useState, useEffect } from 'react';
import { createSong, updateSong } from '../services/songs';
import './SongModal.css';

function SongModal({ song, styles, onClose }) {
  const [formData, setFormData] = useState({
    specific_title: '',
    specific_lyrics: '',
    prompt_to_generate: '',
    style_id: '',
    vocal_gender: 'male',
    status: 'create',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (song) {
      setFormData({
        specific_title: song.specific_title || '',
        specific_lyrics: song.specific_lyrics || '',
        prompt_to_generate: song.prompt_to_generate || '',
        style_id: song.style_id || '',
        vocal_gender: song.vocal_gender || 'male',
        status: song.status || 'create',
      });
    }
  }, [song]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Convert empty string to null for style_id
      const dataToSend = {
        ...formData,
        style_id: formData.style_id ? parseInt(formData.style_id) : null,
      };

      if (song) {
        await updateSong(song.id, dataToSend);
      } else {
        await createSong(dataToSend);
      }

      onClose(true); // true = refresh the list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save song');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{song ? 'Edit Song' : 'Add New Song'}</h2>
          <button className="modal-close" onClick={() => onClose(false)}>
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Song Title</label>
              <input
                type="text"
                name="specific_title"
                value={formData.specific_title}
                onChange={handleChange}
                placeholder="Enter song title"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="create">Create</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
                <option value="unspecified">Unspecified</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Lyrics</label>
            <textarea
              name="specific_lyrics"
              value={formData.specific_lyrics}
              onChange={handleChange}
              rows="6"
              placeholder="Enter song lyrics..."
            />
          </div>

          <div className="form-group">
            <label>Prompt to Generate (Optional)</label>
            <textarea
              name="prompt_to_generate"
              value={formData.prompt_to_generate}
              onChange={handleChange}
              rows="3"
              placeholder="Custom prompt for song generation..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Style</label>
              <select name="style_id" value={formData.style_id} onChange={handleChange}>
                <option value="">Select a style</option>
                {styles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Vocal Gender</label>
              <select
                name="vocal_gender"
                value={formData.vocal_gender}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
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
              {saving ? 'Saving...' : song ? 'Update Song' : 'Create Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SongModal;
