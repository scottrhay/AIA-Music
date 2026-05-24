import React from 'react';
import './TrackGrid.css';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';

function TrackGrid({ songs, loading, children, hasFilters, onAddSong }) {
  if (loading) {
    return (
      <div className="track-grid">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (songs.length === 0) {
    return <EmptyState hasFilters={hasFilters} onAddSong={onAddSong} />;
  }

  return (
    <div className="track-grid">
      {children}
    </div>
  );
}

export default TrackGrid;
