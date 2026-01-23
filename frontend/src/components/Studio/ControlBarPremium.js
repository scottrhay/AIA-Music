import React, { useState } from 'react';
import './ControlBarPremium.css';

function ControlBarPremium({ filters, onFilterChange, styles, playlists = [], onClearFilters }) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFilterCount = [
    filters.search,
    filters.style_id,
    filters.playlist_id,
    filters.vocal_gender !== 'all',
    filters.min_stars > 0,
    filters.all_users
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="control-bar-premium">
      <div className="control-bar-premium__main">
        {/* Search - Dominant */}
        <div className="control-bar-premium__search">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            className="control-bar-premium__input"
            placeholder="Search tracks..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            aria-label="Search songs"
          />
          {filters.search && (
            <button
              className="clear-btn"
              onClick={() => onFilterChange('search', '')}
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="control-bar-premium__filters control-bar-premium__filters--desktop">
          <select
            className="control-bar-premium__select"
            value={filters.style_id}
            onChange={(e) => onFilterChange('style_id', e.target.value)}
            aria-label="Filter by style"
          >
            <option value="">All styles</option>
            {styles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>

          <select
            className="control-bar-premium__select"
            value={filters.playlist_id || ''}
            onChange={(e) => onFilterChange('playlist_id', e.target.value)}
            aria-label="Filter by playlist"
          >
            <option value="">All playlists</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>

          <select
            className="control-bar-premium__select"
            value={filters.vocal_gender}
            onChange={(e) => onFilterChange('vocal_gender', e.target.value)}
            aria-label="Filter by vocal gender"
          >
            <option value="all">All vocals</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <select
            className="control-bar-premium__select"
            value={filters.min_stars || 0}
            onChange={(e) => onFilterChange('min_stars', parseInt(e.target.value))}
            aria-label="Filter by star rating"
          >
            <option value="0">All ratings</option>
            <option value="1">⭐ 1+ stars</option>
            <option value="2">⭐ 2+ stars</option>
            <option value="3">⭐ 3+ stars</option>
            <option value="4">⭐ 4+ stars</option>
            <option value="5">⭐ 5 stars</option>
          </select>

          <label className="control-bar-premium__checkbox">
            <input
              type="checkbox"
              checked={filters.all_users}
              onChange={(e) => onFilterChange('all_users', e.target.checked)}
            />
            <span className="checkbox-box"></span>
            <span className="checkbox-label">All users</span>
          </label>

          {hasActiveFilters && (
            <button
              className="control-bar-premium__clear"
              onClick={onClearFilters}
            >
              Clear
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <button
          className="control-bar-premium__mobile-toggle"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          aria-label="Toggle filters"
          aria-expanded={showMobileFilters}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 5.83333H17.5M5.83333 10H14.1667M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Mobile Filter Panel */}
      {showMobileFilters && (
        <div className="control-bar-premium__mobile-panel">
          <div className="mobile-filter-group">
            <label className="mobile-filter-label">Style</label>
            <select
              className="control-bar-premium__select"
              value={filters.style_id}
              onChange={(e) => onFilterChange('style_id', e.target.value)}
            >
              <option value="">All styles</option>
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mobile-filter-group">
            <label className="mobile-filter-label">Playlist</label>
            <select
              className="control-bar-premium__select"
              value={filters.playlist_id || ''}
              onChange={(e) => onFilterChange('playlist_id', e.target.value)}
            >
              <option value="">All playlists</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mobile-filter-group">
            <label className="mobile-filter-label">Vocal</label>
            <select
              className="control-bar-premium__select"
              value={filters.vocal_gender}
              onChange={(e) => onFilterChange('vocal_gender', e.target.value)}
            >
              <option value="all">All vocals</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mobile-filter-group">
            <label className="mobile-filter-label">Rating</label>
            <select
              className="control-bar-premium__select"
              value={filters.min_stars || 0}
              onChange={(e) => onFilterChange('min_stars', parseInt(e.target.value))}
            >
              <option value="0">All ratings</option>
              <option value="1">⭐ 1+ stars</option>
              <option value="2">⭐ 2+ stars</option>
              <option value="3">⭐ 3+ stars</option>
              <option value="4">⭐ 4+ stars</option>
              <option value="5">⭐ 5 stars</option>
            </select>
          </div>

          <label className="control-bar-premium__checkbox">
            <input
              type="checkbox"
              checked={filters.all_users}
              onChange={(e) => onFilterChange('all_users', e.target.checked)}
            />
            <span className="checkbox-box"></span>
            <span className="checkbox-label">Show all users' songs</span>
          </label>

          {hasActiveFilters && (
            <button
              className="control-bar-premium__clear control-bar-premium__clear--mobile"
              onClick={() => {
                onClearFilters();
                setShowMobileFilters(false);
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ControlBarPremium;
