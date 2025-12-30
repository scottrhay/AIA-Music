import React from 'react';
import './SongCard.css';

function SongCard({ song, onEdit, onDelete, onRecreate }) {
  const getStatusClass = (status) => {
    switch (status) {
      case 'create':
        return 'status-create';
      case 'submitted':
        return 'status-submitted';
      case 'completed':
        return 'status-completed';
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

  return (
    <div className="song-card">
      <div className="song-card-header">
        <div className="song-icon">♫</div>
        <span className={`status-badge ${getStatusClass(song.status)}`}>
          {getStatusLabel(song.status)}
        </span>
      </div>

      <div className="song-card-body">
        <h3 className="song-title">
          {song.specific_title || 'Untitled Song'}
        </h3>

        <p className="song-lyrics">{truncateText(song.specific_lyrics)}</p>

        <div className="song-meta">
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
          {song.creator && (
            <div className="meta-item">
              <span className="meta-label">Creator:</span>
              <span className="meta-value">{song.creator}</span>
            </div>
          )}
        </div>

        {(song.download_url_1 || song.download_url_2) && (
          <div className="song-downloads">
            {song.download_url_1 && (
              <a
                href={song.download_url_1}
                target="_blank"
                rel="noopener noreferrer"
                className="download-link"
              >
                Download 1
              </a>
            )}
            {song.download_url_2 && (
              <a
                href={song.download_url_2}
                target="_blank"
                rel="noopener noreferrer"
                className="download-link"
              >
                Download 2
              </a>
            )}
          </div>
        )}
      </div>

      <div className="song-card-footer">
        <button className="btn-edit" onClick={() => onEdit(song)}>
          Edit
        </button>
        <button className="btn-recreate" onClick={() => onRecreate(song.id)}>
          Recreate
        </button>
        <button className="btn-delete" onClick={() => onDelete(song.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default SongCard;
