import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSongs, getSongStats, deleteSong, recreateSong } from '../services/songs';
import { getStyles } from '../services/styles';
import { getUser } from '../services/auth';
import SongCard from '../components/SongCard';
import SongModal from '../components/SongModal';
import './Home.css';

function Home({ onLogout }) {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [styles, setStyles] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    style_id: '',
    vocal_gender: 'all',
    search: '',
    all_users: false,
  });

  const user = getUser();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [songsData, stylesData, statsData] = await Promise.all([
        getSongs(filters),
        getStyles(),
        getSongStats(filters.all_users),
      ]);

      setSongs(songsData.songs);
      setStyles(stylesData.styles);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = () => {
    setEditingSong(null);
    setShowModal(true);
  };

  const handleEditSong = (song) => {
    setEditingSong(song);
    setShowModal(true);
  };

  const handleDeleteSong = async (songId) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      try {
        await deleteSong(songId);
        loadData();
      } catch (error) {
        console.error('Error deleting song:', error);
        alert('Failed to delete song');
      }
    }
  };

  const handleRecreateSong = async (songId) => {
    if (window.confirm('This will regenerate the song. Continue?')) {
      try {
        await recreateSong(songId);
        loadData();
        alert('Song submitted for regeneration!');
      } catch (error) {
        console.error('Error recreating song:', error);
        // Extract the error message from the response
        const errorMessage = error.response?.data?.error || error.message || 'Failed to recreate song';
        alert(errorMessage);
      }
    }
  };

  const handleModalClose = (shouldRefresh) => {
    setShowModal(false);
    setEditingSong(null);
    if (shouldRefresh) {
      loadData();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusCount = (status) => {
    switch (status) {
      case 'all':
        return stats.total || 0;
      case 'create':
        return stats.create || 0;
      case 'submitted':
        return stats.submitted || 0;
      case 'completed':
        return stats.completed || 0;
      default:
        return 0;
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Song Management App</h1>
        <div className="header-nav">
          <button className="nav-button primary" onClick={handleAddSong}>
            Add New Song
          </button>
          <button className="nav-button secondary" onClick={() => navigate('/styles')}>
            Manage Styles
          </button>
          <button className="nav-button logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="hero-banner"></div>

        <div className="section-header">
          <span className="badge primary">Song Management</span>
          <span className="badge secondary">{songs.length} tracks</span>
        </div>

        <p className="section-description">
          Search, filter, and manage your songs. Use the controls below to refine by status, style, or vocal gender.
        </p>

        <div className="status-tabs">
          <button
            className={`status-tab ${filters.status === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('status', 'all')}
          >
            All ({getStatusCount('all')})
          </button>
          <button
            className={`status-tab ${filters.status === 'create' ? 'active' : ''}`}
            onClick={() => handleFilterChange('status', 'create')}
          >
            Create ({getStatusCount('create')})
          </button>
          <button
            className={`status-tab ${filters.status === 'submitted' ? 'active' : ''}`}
            onClick={() => handleFilterChange('status', 'submitted')}
          >
            Submitted ({getStatusCount('submitted')})
          </button>
          <button
            className={`status-tab ${filters.status === 'completed' ? 'active' : ''}`}
            onClick={() => handleFilterChange('status', 'completed')}
          >
            Completed ({getStatusCount('completed')})
          </button>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Find by title, lyrics, or style"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Style</label>
            <select
              value={filters.style_id}
              onChange={(e) => handleFilterChange('style_id', e.target.value)}
            >
              <option value="">All styles</option>
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Vocal Gender</label>
            <select
              value={filters.vocal_gender}
              onChange={(e) => handleFilterChange('vocal_gender', e.target.value)}
            >
              <option value="all">All vocal genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="filter-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={filters.all_users}
                onChange={(e) => handleFilterChange('all_users', e.target.checked)}
              />
              Show all team songs
            </label>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading songs...</div>
        ) : songs.length === 0 ? (
          <div className="empty-state">
            <p>No songs found. Create your first song to get started!</p>
            <button className="btn btn-primary" onClick={handleAddSong}>
              Add New Song
            </button>
          </div>
        ) : (
          <div className="songs-grid">
            {songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onEdit={handleEditSong}
                onDelete={handleDeleteSong}
                onRecreate={handleRecreateSong}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <SongModal
          song={editingSong}
          styles={styles}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default Home;
