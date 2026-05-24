import React from 'react';
import './EmptyState.css';

function EmptyState({ onAddSong, hasFilters }) {
  if (hasFilters) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon empty-state__icon--search">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="empty-state__title">No songs match your filters</h3>
        <p className="empty-state__description">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
      <h3 className="empty-state__title">Create your first song</h3>
      <p className="empty-state__description">
        Get started by creating a new song. Add your lyrics, choose a style, and let's start creating music!
      </p>
      <button className="empty-state__cta" onClick={onAddSong}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Create New Song</span>
      </button>
    </div>
  );
}

export default EmptyState;
