import React from 'react';
import './StudioHeader.css';

function StudioHeader({ stats, onAddSong, onManageStyles, onLogout }) {
  const generatingCount = stats.submitted || 0;
  const completedCount = stats.completed || 0;
  const totalCount = stats.total || 0;

  return (
    <header className="studio-header">
      {/* Animated waveform background */}
      <div className="studio-header__waveform" aria-hidden="true">
        <div className="waveform-bar" style={{ animationDelay: '0ms' }}></div>
        <div className="waveform-bar" style={{ animationDelay: '100ms' }}></div>
        <div className="waveform-bar" style={{ animationDelay: '200ms' }}></div>
        <div className="waveform-bar" style={{ animationDelay: '300ms' }}></div>
        <div className="waveform-bar" style={{ animationDelay: '400ms' }}></div>
        <div className="waveform-bar" style={{ animationDelay: '500ms' }}></div>
        <div className="waveform-bar" style={{ animationDelay: '600ms' }}></div>
        <div className="waveform-bar" style={{ animationDelay: '700ms' }}></div>
      </div>

      <div className="studio-header__content">
        {/* Left: Brand and stats */}
        <div className="studio-header__left">
          <h1 className="studio-header__title">
            AIA Speech Studio
          </h1>

          <div className="studio-header__stats">
            <div className="stat-item">
              <span className="stat-value">{totalCount}</span>
              <span className="stat-label">Clips</span>
            </div>
            <div className="stat-divider" aria-hidden="true"></div>
            <div className="stat-item">
              <span className="stat-value">{completedCount}</span>
              <span className="stat-label">Ready</span>
            </div>
            {generatingCount > 0 && (
              <>
                <div className="stat-divider" aria-hidden="true"></div>
                <div className="stat-item stat-item--generating">
                  <span className="stat-value">
                    {generatingCount}
                    <span className="generating-indicator" aria-label="Generating"></span>
                  </span>
                  <span className="stat-label">Generating</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="studio-header__actions">
          <button
            className="studio-btn studio-btn--primary"
            onClick={onAddSong}
            aria-label="Add new voice clip"
          >
            <svg className="studio-btn__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>New Clip</span>
          </button>

          <button
            className="studio-btn studio-btn--secondary"
            onClick={onManageStyles}
            aria-label="Manage voices"
          >
            <svg className="studio-btn__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L12 7H16L13 10L14 14L10 11L6 14L7 10L4 7H8L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Voices</span>
          </button>

          <button
            className="studio-btn studio-btn--ghost"
            onClick={onLogout}
            aria-label="Logout"
          >
            <svg className="studio-btn__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3H16C16.5304 3 17.0391 3.21071 17.4142 3.58579C17.7893 3.96086 18 4.46957 18 5V15C18 15.5304 17.7893 16.0391 17.4142 16.4142C17.0391 16.7893 16.5304 17 16 17H13M7 13L3 10M3 10L7 7M3 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="sr-only">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default StudioHeader;
