import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TopBar.css';

function TopBar({ onAddSong, onManageStyles, onManageSongs, onLogout, primaryButtonText, primaryButtonIcon }) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentMode = location.pathname === '/player' || location.pathname === '/playlists'
    ? 'player'
    : 'studio';

  const handleModeChange = (mode) => {
    if (mode === 'studio') {
      navigate('/');
    } else {
      navigate('/player');
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar__container">
        {/* Left: Logo */}
        <div className="top-bar__left">
          <div className="top-bar__logo" onClick={() => navigate('/')} role="button" tabIndex={0}>
            <div className="top-bar__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h1 className="top-bar__title">AIA Music</h1>
          </div>
        </div>

        {/* Center: Mode Switcher with sliding indicator */}
        <div className="top-bar__mode-switcher" data-mode={currentMode}>
          <button
            className={`top-bar__mode-btn ${currentMode === 'studio' ? 'active' : ''}`}
            onClick={() => handleModeChange('studio')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
              <path d="M7 8h2M7 12h2" />
            </svg>
            <span>Studio</span>
          </button>
          <button
            className={`top-bar__mode-btn ${currentMode === 'player' ? 'active' : ''}`}
            onClick={() => handleModeChange('player')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
            </svg>
            <span>Player</span>
          </button>
        </div>

        {/* Right: Mode-specific actions */}
        <div className="top-bar__actions">
          {currentMode === 'studio' ? (
            <>
              {onAddSong && (
                <button
                  className="top-bar__btn top-bar__btn--primary"
                  onClick={onAddSong}
                  aria-label={primaryButtonText || "New Song"}
                >
                  {primaryButtonIcon === 'palette' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="13.5" cy="6.5" r="2.5" />
                      <circle cx="19" cy="13" r="2" />
                      <circle cx="6" cy="12" r="2.5" />
                      <circle cx="10" cy="18" r="2" />
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 2-.8 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.4c3 0 5.6-2.5 5.6-5.6C22 5.8 17.5 2 12 2z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                  <span>{primaryButtonText || "New Song"}</span>
                </button>
              )}
              {onManageStyles && (
                <button
                  className="top-bar__btn top-bar__btn--secondary"
                  onClick={onManageStyles}
                  aria-label="Styles"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r="2.5" />
                    <circle cx="19" cy="13" r="2" />
                    <circle cx="6" cy="12" r="2.5" />
                    <circle cx="10" cy="18" r="2" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 2-.8 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.4c3 0 5.6-2.5 5.6-5.6C22 5.8 17.5 2 12 2z" />
                  </svg>
                  <span>Styles</span>
                </button>
              )}
              {onManageSongs && (
                <button
                  className="top-bar__btn top-bar__btn--secondary"
                  onClick={onManageSongs}
                  aria-label="Songs"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <span>Songs</span>
                </button>
              )}
            </>
          ) : (
            <button
              className={`top-bar__btn ${location.pathname === '/playlists' ? 'top-bar__btn--primary' : 'top-bar__btn--secondary'}`}
              onClick={() => navigate('/playlists')}
              aria-label="Playlists"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
              <span>Playlists</span>
            </button>
          )}

          <div className="top-bar__divider" />

          {/* Logout */}
          <button
            className="top-bar__btn top-bar__btn--ghost"
            onClick={onLogout}
            aria-label="Logout"
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
