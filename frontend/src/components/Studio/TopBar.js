import React from 'react';
import './TopBar.css';

function TopBar({ onAddSong, onManageStyles, onLogout, primaryButtonText = "+ New Clip", secondaryButtonText = "Voices", showPrimaryIcon = true, showSecondaryIcon = false, primaryIconType = "plus", secondaryIconType = "none" }) {

  const renderPrimaryIcon = () => {
    if (!showPrimaryIcon) return null;

    if (primaryIconType === "back") {
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }

    // Default plus icon
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const renderSecondaryIcon = () => {
    if (!showSecondaryIcon) return null;

    if (secondaryIconType === "plus") {
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }

    return null;
  };

  return (
    <header className="top-bar">
      <div className="top-bar__container">
        <div className="top-bar__left">
          <h1 className="top-bar__title">AIA Speech Studio</h1>
        </div>

        <div className="top-bar__actions">
          {onAddSong && (
            <button
              className="top-bar__btn top-bar__btn--primary"
              onClick={onAddSong}
              aria-label={primaryButtonText}
            >
              {renderPrimaryIcon()}
              <span>{primaryButtonText}</span>
            </button>
          )}

          {onManageStyles && (
            <button
              className="top-bar__btn top-bar__btn--secondary"
              onClick={onManageStyles}
              aria-label={secondaryButtonText}
            >
              {renderSecondaryIcon()}
              <span>{secondaryButtonText}</span>
            </button>
          )}

          <button
            className="top-bar__btn top-bar__btn--ghost"
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3H16C16.5304 3 17.0391 3.21071 17.4142 3.58579C17.7893 3.96086 18 4.46957 18 5V15C18 15.5304 17.7893 16.0391 17.4142 16.4142C17.0391 16.7893 16.5304 17 16 17H13M7 13L3 10M3 10L7 7M3 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
