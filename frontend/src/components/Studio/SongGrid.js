import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import './SongGrid.css';

function SongGrid({ songs, loading, onAddSong, hasFilters, children }) {
  if (loading) {
    return <LoadingSkeleton count={6} />;
  }

  if (songs.length === 0) {
    return <EmptyState onAddSong={onAddSong} hasFilters={hasFilters} />;
  }

  return (
    <div className="song-grid">
      {children}
    </div>
  );
}

export default SongGrid;
