import React, { useState } from 'react';
import './ControlBar.css';

function ControlBar({ filters, onFilterChange, styles, onClearFilters }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeFilterCount = [
    filters.search,
    filters.style_id,
    filters.vocal_gender !== 'all',
    filters.all_users
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const handleClearAll = () => {
    onClearFilters();
  };

  return (
    <div className="control-bar-wrapper">
      <div className={`control-bar ${isExpanded ? 'control-bar--expanded' : 'control-bar--collapsed'}`}>
        <div className="control-bar__header">
          <div className="control-bar__title">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 5.83333H17.5M5.83333 10H14.1667M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="filter-count-badge">{activeFilterCount}</span>
            )}
          </div>

          <button
            className="control-bar__toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            aria-expanded={isExpanded}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={isExpanded ? 'rotate-180' : ''}
            >
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="control-bar__content">
            {/* Search Input */}
            <div className="control-group control-group--search">
              <label htmlFor="search-input" className="control-label">
                Search
              </label>
              <div className="search-input-wrapper">
                <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  id="search-input"
                  type="text"
                  className="control-input control-input--search"
                  placeholder="Find by title, lyrics, or style..."
                  value={filters.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                />
                {filters.search && (
                  <button
                    className="clear-input-btn"
                    onClick={() => onFilterChange('search', '')}
                    aria-label="Clear search"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Style Selector */}
            <div className="control-group">
              <label htmlFor="style-select" className="control-label">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3L12 7H16L13 10L14 14L10 11L6 14L7 10L4 7H8L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Style
              </label>
              <select
                id="style-select"
                className="control-select"
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

            {/* Vocal Gender Selector */}
            <div className="control-group">
              <label htmlFor="vocal-select" className="control-label">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 15C6 13.3431 7.34315 12 9 12H11C12.6569 12 14 13.3431 14 15M11.5 6.5C11.5 7.88071 10.3807 9 9 9C7.61929 9 6.5 7.88071 6.5 6.5C6.5 5.11929 7.61929 4 9 4C10.3807 4 11.5 5.11929 11.5 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Vocal
              </label>
              <select
                id="vocal-select"
                className="control-select"
                value={filters.vocal_gender}
                onChange={(e) => onFilterChange('vocal_gender', e.target.value)}
              >
                <option value="all">All vocals</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Show All Users Toggle */}
            <div className="control-group control-group--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={filters.all_users}
                  onChange={(e) => onFilterChange('all_users', e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Show all users' songs</span>
              </label>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="control-group control-group--action">
                <button
                  className="clear-filters-btn"
                  onClick={handleClearAll}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7H16M7 7V4C7 3.46957 7.21071 2.96086 7.58579 2.58579C7.96086 2.21071 8.46957 2 9 2H11C11.5304 2 12.0391 2.21071 12.4142 2.58579C12.7893 2.96086 13 3.46957 13 4V7M15 7V16C15 16.5304 14.7893 17.0391 14.4142 17.4142C14.0391 17.7893 13.5304 18 13 18H7C6.46957 18 5.96086 17.7893 5.58579 17.4142C5.21071 17.0391 5 16.5304 5 16V7H15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && isExpanded && (
        <div className="filter-chips">
          {filters.search && (
            <div className="filter-chip">
              <span className="filter-chip__label">Search:</span>
              <span className="filter-chip__value">{filters.search}</span>
              <button
                className="filter-chip__remove"
                onClick={() => onFilterChange('search', '')}
                aria-label="Remove search filter"
              >
                ×
              </button>
            </div>
          )}

          {filters.style_id && (
            <div className="filter-chip">
              <span className="filter-chip__label">Style:</span>
              <span className="filter-chip__value">
                {styles.find(s => s.id === parseInt(filters.style_id))?.name || 'Unknown'}
              </span>
              <button
                className="filter-chip__remove"
                onClick={() => onFilterChange('style_id', '')}
                aria-label="Remove style filter"
              >
                ×
              </button>
            </div>
          )}

          {filters.vocal_gender !== 'all' && (
            <div className="filter-chip">
              <span className="filter-chip__label">Vocal:</span>
              <span className="filter-chip__value">
                {filters.vocal_gender.charAt(0).toUpperCase() + filters.vocal_gender.slice(1)}
              </span>
              <button
                className="filter-chip__remove"
                onClick={() => onFilterChange('vocal_gender', 'all')}
                aria-label="Remove vocal filter"
              >
                ×
              </button>
            </div>
          )}

          {filters.all_users && (
            <div className="filter-chip">
              <span className="filter-chip__value">All users' songs</span>
              <button
                className="filter-chip__remove"
                onClick={() => onFilterChange('all_users', false)}
                aria-label="Remove all users filter"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ControlBar;
