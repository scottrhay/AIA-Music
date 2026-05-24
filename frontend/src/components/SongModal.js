import React, { useState, useEffect, useRef } from 'react';
import { createSong, updateSong, uploadSong } from '../services/songs';
import { getStyles } from '../services/styles';
import './SongModal.css';

// ─── Field limits ──────────────────────────────────────────────────────────
const LYRICS_MAX   = 5000;
const LYRICS_WARN  = 4500;
const PROMPT_MAX   = 3000;

// ─── Tiny Toast ────────────────────────────────────────────────────────────
function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="song-modal-toast" role="alert" aria-live="assertive">
      <span className="song-modal-toast__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <span className="song-modal-toast__text">{message}</span>
      <button className="song-modal-toast__close" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}

// ─── Character Counter ─────────────────────────────────────────────────────
function CharCounter({ value, max, warnAt }) {
  const len = value ? value.length : 0;
  const isWarning = len >= warnAt;
  const isOver    = len > max;
  return (
    <span className={`char-counter ${isOver ? 'char-counter--over' : isWarning ? 'char-counter--warn' : ''}`}>
      {len.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}

// ─── SongModal ─────────────────────────────────────────────────────────────
function SongModal({ song, styles: propStyles, songs, onClose }) {
  const [styles, setStyles] = useState(propStyles || []);
  const [mode, setMode] = useState('ai'); // 'ai' or 'upload'
  const [formData, setFormData] = useState({
    specific_title: '',
    version: 'v1',
    specific_lyrics: '',
    prompt_to_generate: '',
    style_id: '',
    vocal_gender: 'male',
    status: 'create',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Error state — supports both a generic banner and per-field errors
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // { field_name: message }
  const [toast, setToast] = useState(null);

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!propStyles || propStyles.length === 0) {
      getStyles().then(data => setStyles(data.styles || [])).catch(() => {});
    }
  }, [propStyles]);

  useEffect(() => {
    if (song) {
      setFormData({
        specific_title: song.specific_title || '',
        version: song.version || 'v1',
        specific_lyrics: song.specific_lyrics || '',
        prompt_to_generate: song.prompt_to_generate || '',
        style_id: song.style?.id || song.style_id || '',
        vocal_gender: song.vocal_gender || 'male',
        status: song.status || 'create',
      });
    }
  }, [song]);

  const calculateNextVersion = (title) => {
    if (!title || !songs || songs.length === 0) return 'v1';
    const sameTitleSongs = songs.filter(s =>
      s.specific_title && s.specific_title.toLowerCase() === title.toLowerCase()
    );
    if (sameTitleSongs.length === 0) return 'v1';
    const versionNumbers = sameTitleSongs
      .map(s => { const m = (s.version || 'v1').match(/v(\d+)/); return m ? parseInt(m[1]) : 1; })
      .filter(n => !isNaN(n));
    return `v${Math.max(...versionNumbers, 0) + 1}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'specific_title' && (!song || !song.id)) {
      setFormData(prev => ({ ...prev, [name]: value, version: calculateNextVersion(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
    // Clear the field-level error for this field on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  // ── File handling ────────────────────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.mp3')) { setError('Only MP3 files are allowed'); return; }
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) { setError('File too large. Maximum size is 100MB'); return; }
    setSelectedFile(file);
    setError('');
  };

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop      = (e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files[0]); };
  const handleFileInputChange = (e) => handleFileSelect(e.target.files[0]);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSaving(true);

    try {
      if (mode === 'upload') {
        if (!selectedFile)                     { setError('Please select an audio file'); setSaving(false); return; }
        if (!formData.specific_title.trim())   { setError('Song title is required');      setSaving(false); return; }
        const fd = new FormData();
        fd.append('audio_file', selectedFile);
        fd.append('title', formData.specific_title);
        fd.append('version', formData.version);
        fd.append('lyrics', formData.specific_lyrics || '');
        await uploadSong(fd, setUploadProgress);
      } else {
        const dataToSend = { ...formData, style_id: formData.style_id ? parseInt(formData.style_id) : null };
        if (song && song.id) {
          await updateSong(song.id, dataToSend);
        } else {
          await createSong(dataToSend);
        }
      }
      onClose(true);
    } catch (err) {
      const data = err.response?.data;
      setUploadProgress(0);

      if (data && data.field) {
        // Structured field-level error from backend
        setFieldErrors({ [data.field]: data.error });
        setToast(data.error);
      } else {
        setError(data?.error || 'Failed to save song');
      }
    } finally {
      setSaving(false);
    }
  };

  const isEditing = song && song.id;
  const isUploadedSong = song && song.source_type === 'uploaded';

  const lyricsLen  = formData.specific_lyrics.length;
  const promptLen  = formData.prompt_to_generate.length;
  const lyricsOver = lyricsLen > LYRICS_MAX;

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Toast */}
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

        <div className="modal-header">
          <h2>{isEditing ? (isUploadedSong ? 'Edit Uploaded Song' : 'Edit Song') : 'Create New Song'}</h2>
          <button className="modal-close" onClick={() => onClose(false)}>×</button>
        </div>

        {/* Mode Toggle */}
        {!isEditing && (
          <div className="mode-toggle-container">
            <div className="mode-toggle">
              <button type="button" className={`mode-toggle__btn ${mode === 'ai' ? 'active' : ''}`} onClick={() => setMode('ai')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                  <circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>
                </svg>
                Create with AI
              </button>
              <button type="button" className={`mode-toggle__btn ${mode === 'upload' ? 'active' : ''}`} onClick={() => setMode('upload')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload File
              </button>
            </div>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Title + Version */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>Song Title</label>
              <input type="text" name="specific_title" value={formData.specific_title} onChange={handleChange} placeholder="Enter song title" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Version</label>
              <input
                type="text" name="version" value={formData.version} onChange={handleChange} placeholder="v1"
                readOnly={!song || !song.id}
                style={{ backgroundColor: (!song || !song.id) ? '#f5f5f5' : 'white' }}
                title={(!song || !song.id) ? 'Version is auto-calculated based on title' : 'Edit version number'}
              />
            </div>
          </div>

          {/* Upload drop zone */}
          {mode === 'upload' && !isEditing && (
            <div className="form-group">
              <label>Audio File (MP3)</label>
              <div
                className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".mp3,audio/mpeg" onChange={handleFileInputChange} style={{ display: 'none' }} />
                {selectedFile ? (
                  <div className="file-info">
                    <div className="file-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                      </svg>
                    </div>
                    <div className="file-details">
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                    </div>
                    <button type="button" className="file-remove" onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}>×</button>
                  </div>
                ) : (
                  <div className="drop-zone-content">
                    <svg className="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="drop-zone-text">Drag and drop MP3 file or click to browse</span>
                    <span className="drop-zone-hint">Maximum file size: 100MB</span>
                  </div>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div className="upload-progress__bar" style={{ width: `${uploadProgress}%` }}></div>
                  <span className="upload-progress__text">{uploadProgress}%</span>
                </div>
              )}
            </div>
          )}

          {/* Lyrics */}
          <div className={`form-group ${fieldErrors.specific_lyrics ? 'form-group--error' : ''}`}>
            <div className="form-group__label-row">
              <label>{(mode === 'upload' || isUploadedSong) ? 'Lyrics (optional)' : 'Lyrics (for Custom Mode)'}</label>
              <CharCounter value={formData.specific_lyrics} max={LYRICS_MAX} warnAt={LYRICS_WARN} />
            </div>
            <textarea
              name="specific_lyrics"
              value={formData.specific_lyrics}
              onChange={handleChange}
              rows="6"
              className={fieldErrors.specific_lyrics ? 'input--error' : lyricsOver ? 'input--over-limit' : ''}
              placeholder={(mode === 'upload' || isUploadedSong)
                ? "Enter lyrics for reference (optional)"
                : "Enter lyrics for your song... Leave empty to let AI generate lyrics."}
            />
            {fieldErrors.specific_lyrics
              ? <small className="form-hint form-hint--error">{fieldErrors.specific_lyrics}</small>
              : mode === 'ai' && !isUploadedSong
                ? <small className="form-hint">If you provide lyrics, Suno will use Custom Mode. Leave empty for AI-generated lyrics.</small>
                : null
            }
          </div>

          {/* AI-only fields */}
          {mode === 'ai' && !isUploadedSong && (
            <>
              <div className={`form-group ${fieldErrors.prompt_to_generate ? 'form-group--error' : ''}`}>
                <div className="form-group__label-row">
                  <label>Prompt / Description (for Simple Mode)</label>
                  <CharCounter value={formData.prompt_to_generate} max={PROMPT_MAX} warnAt={PROMPT_MAX - 500} />
                </div>
                <textarea
                  name="prompt_to_generate"
                  value={formData.prompt_to_generate}
                  onChange={handleChange}
                  rows="3"
                  className={fieldErrors.prompt_to_generate ? 'input--error' : ''}
                  placeholder="Describe the song you want (e.g., 'An upbeat pop song about summer adventures')"
                />
                {fieldErrors.prompt_to_generate
                  ? <small className="form-hint form-hint--error">{fieldErrors.prompt_to_generate}</small>
                  : <small className="form-hint">Used when lyrics are empty. Describe the song you want AI to create.</small>
                }
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Music Style</label>
                  <select name="style_id" value={formData.style_id} onChange={handleChange}>
                    <option value="">Select a style...</option>
                    {styles.map((style) => (
                      <option key={style.id} value={style.id}>{style.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Vocal Gender</label>
                  <select name="vocal_gender" value={formData.vocal_gender} onChange={handleChange}>
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || lyricsOver}
            >
              {saving
                ? (mode === 'upload' ? 'Uploading...' : 'Creating...')
                : isEditing
                  ? 'Update Song'
                  : (mode === 'upload' ? 'Upload Song' : 'Create Song')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SongModal;
