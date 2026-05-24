import React from 'react';
import './StudioStats.css';

function StudioStats({ stats }) {
  const generatingCount = stats.submitted || 0;
  const completedCount = stats.completed || 0;
  const totalCount = stats.total || 0;

  return (
    <div className="studio-stats">
      <div className="studio-stats__chip">
        <span className="studio-stats__value">{totalCount}</span>
        <span className="studio-stats__label">Tracks</span>
      </div>

      <div className="studio-stats__chip">
        <span className="studio-stats__value">{completedCount}</span>
        <span className="studio-stats__label">Ready</span>
      </div>

      {generatingCount > 0 && (
        <div className="studio-stats__chip studio-stats__chip--generating">
          <span className="studio-stats__value">
            {generatingCount}
            <span className="studio-stats__pulse" aria-label="Generating"></span>
          </span>
          <span className="studio-stats__label">Generating</span>
        </div>
      )}
    </div>
  );
}

export default StudioStats;
