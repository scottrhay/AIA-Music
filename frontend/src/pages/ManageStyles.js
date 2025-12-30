import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStyles, createStyle, updateStyle, deleteStyle } from '../services/styles';
import StyleModal from '../components/StyleModal';
import './ManageStyles.css';

function ManageStyles({ onLogout }) {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    try {
      setLoading(true);
      const data = await getStyles();
      setStyles(data.styles);
      if (data.styles.length > 0 && !selectedStyle) {
        setSelectedStyle(data.styles[0]);
      }
    } catch (error) {
      console.error('Error loading styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStyle = () => {
    setEditingStyle(null);
    setShowModal(true);
  };

  const handleEditStyle = (style) => {
    setEditingStyle(style);
    setShowModal(true);
  };

  const handleDeleteStyle = async (styleId) => {
    if (window.confirm('Are you sure you want to delete this style?')) {
      try {
        await deleteStyle(styleId);
        if (selectedStyle?.id === styleId) {
          setSelectedStyle(null);
        }
        loadStyles();
      } catch (error) {
        console.error('Error deleting style:', error);
        alert(error.response?.data?.error || 'Failed to delete style');
      }
    }
  };

  const handleModalClose = (shouldRefresh) => {
    setShowModal(false);
    setEditingStyle(null);
    if (shouldRefresh) {
      loadStyles();
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Song Management App</h1>
        <div className="header-nav">
          <button className="nav-button primary" onClick={() => navigate('/')}>
            Home
          </button>
          <button className="nav-button secondary" onClick={handleAddStyle}>
            Add New Style
          </button>
          <button className="nav-button logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="section-header">
          <span className="badge primary">Style Management</span>
          <span className="badge secondary">{styles.length} styles</span>
        </div>

        <p className="section-description">
          Manage your music styles. Create, edit, and organize style templates for song generation.
        </p>

        {loading ? (
          <div className="loading">Loading styles...</div>
        ) : styles.length === 0 ? (
          <div className="empty-state">
            <p>No styles found. Create your first style to get started!</p>
            <button className="btn btn-primary" onClick={handleAddStyle}>
              Add New Style
            </button>
          </div>
        ) : (
          <div className="styles-layout">
            <div className="styles-sidebar">
              <h3>Styles</h3>
              <div className="styles-list">
                {styles.map((style) => (
                  <div
                    key={style.id}
                    className={`style-item ${selectedStyle?.id === style.id ? 'active' : ''}`}
                    onClick={() => setSelectedStyle(style)}
                  >
                    <div className="style-item-name">{style.name}</div>
                    <div className="style-item-actions">
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStyle(style);
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStyle(style.id);
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="style-details">
              {selectedStyle ? (
                <>
                  <div className="details-header">
                    <h2>{selectedStyle.name}</h2>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEditStyle(selectedStyle)}
                    >
                      Edit Style
                    </button>
                  </div>

                  <div className="details-content">
                    {selectedStyle.genre && (
                      <div className="detail-section">
                        <h4>Genre</h4>
                        <p>{selectedStyle.genre}</p>
                      </div>
                    )}

                    {selectedStyle.beat && (
                      <div className="detail-section">
                        <h4>Beat</h4>
                        <p>{selectedStyle.beat}</p>
                      </div>
                    )}

                    {selectedStyle.mood && (
                      <div className="detail-section">
                        <h4>Mood</h4>
                        <p>{selectedStyle.mood}</p>
                      </div>
                    )}

                    {selectedStyle.vocals && (
                      <div className="detail-section">
                        <h4>Vocals</h4>
                        <p>{selectedStyle.vocals}</p>
                      </div>
                    )}

                    {selectedStyle.instrumentation && (
                      <div className="detail-section">
                        <h4>Instrumentation</h4>
                        <p>{selectedStyle.instrumentation}</p>
                      </div>
                    )}

                    {selectedStyle.style_description && (
                      <div className="detail-section">
                        <h4>Style Description</h4>
                        <p>{selectedStyle.style_description}</p>
                      </div>
                    )}

                    {selectedStyle.created_by && (
                      <div className="detail-section meta">
                        <small>Created by: {selectedStyle.created_by}</small>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <p>Select a style to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <StyleModal style={editingStyle} onClose={handleModalClose} />
      )}
    </div>
  );
}

export default ManageStyles;
