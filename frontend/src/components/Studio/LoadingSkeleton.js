import React from 'react';
import './LoadingSkeleton.css';

function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-card__header">
            <div className="skeleton-icon"></div>
            <div className="skeleton-actions">
              <div className="skeleton-btn"></div>
              <div className="skeleton-btn"></div>
            </div>
          </div>
          <div className="skeleton-card__body">
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text skeleton-text--short"></div>
            <div className="skeleton-meta">
              <div className="skeleton-meta-item"></div>
              <div className="skeleton-meta-item"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
