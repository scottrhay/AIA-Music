import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSongs, getSongStats, deleteSong, updateSong } from '../services/songs';
import { getUser } from '../services/auth';
import SongCard from '../components/SongCard';
import SongModal from '../components/SongModal';
import SongViewModal from '../components/SongViewModal';
import './Home.css';

// Azure Speech voice options (same as SongModal)
const AZURE_VOICES = [
  { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew Dragon HD Latest' },
  { id: 'en-US-AvaMultilingualNeural', name: 'Ava Multilingual' },
  { id: 'en-US-PhoebeMultilingualNeural', name: 'Phoebe Multilingual' },
  { id: 'en-US-ChristopherMultilingualNeural', name: 'Christopher Multilingual' },
  { id: 'en-US-BrandonMultilingualNeural', name: 'Brandon Multilingual' },
  { id: 'en-US-DustinMultilingualNeural', name: 'Dustin Multilingual' },
  { id: 'en-US-SteffanMultilingualNeural', name: 'Steffan Multilingual' },
];

function Home({ onLogout }) {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSong, setViewingSong] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    voice_name: '',
    search: '',
    all_users: false,
  });

  const user = getUser();

  useEffect(() => {
    loadData();
  }, [filters]);

  // Auto-refresh when there are songs in submitted status
  useEffect(() => {
    const hasSubmittedSongs = songs.some(song => song.status === 'submitted');

    if (hasSubmittedSongs) {
      const intervalId = setInterval(() => {
        loadData();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(intervalId);
    }
  }, [songs]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [songsData, statsData] = await Promise.all([
        getSongs(filters),
        getSongStats(filters.all_users),
      ]);

      setSongs(songsData.songs);
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

  const handleViewSong = (song) => {
    setViewingSong(song);
    setShowViewModal(true);
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

  const handleDuplicateSong = (song) => {
    // Close view modal if open
    setShowViewModal(false);
    setViewingSong(null);

    // Create a copy of the song without id, status, timestamps, and URLs
    const duplicatedSong = {
      specific_title: song.specific_title,
      specific_lyrics: song.specific_lyrics,
      prompt_to_generate: song.prompt_to_generate,
      style_id: song.style?.id || song.style_id,
      vocal_gender: song.vocal_gender,
    };

    // Open the modal in "create" mode with the duplicated data
    setEditingSong(duplicatedSong);
    setShowModal(true);
  };

  const handleEditSong = (song) => {
    // Close view modal if open
    setShowViewModal(false);
    setViewingSong(null);

    // Open the modal in "edit" mode with the full song data
    setEditingSong(song);
    setShowModal(true);
  };

  const handleUpdateTitle = async (songId, newTitle) => {
    try {
      await updateSong(songId, { specific_title: newTitle });
      loadData();
    } catch (error) {
      console.error('Error updating song title:', error);
    }
  };

  const handleRatingChange = async (songId, rating) => {
    try {
      await updateSong(songId, { star_rating: rating });
      // Update locally without full reload for better UX
      setSongs(prev => prev.map(song => 
        song.id === songId ? { ...song, star_rating: rating } : song
      ));
    } catch (error) {
      console.error('Error updating song rating:', error);
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
      case 'failed':
        return stats.failed || 0;
      default:
        return 0;
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>AIA Music Lab</h1>
        <div className="header-nav">
          <button className="nav-button primary" onClick={handleAddSong}>
            + New Clip
          </button>
          <button className="nav-button secondary" onClick={() => navigate('/styles')}>
            Voices
          </button>
          <button className="nav-button logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="hero-banner"></div>

        <div className="section-header">
          <span className="badge primary">Voice Clip Management</span>
          <span className="badge secondary">{songs.length} clips</span>
        </div>

        <p className="section-description">
          Search, filter, and manage your voice clips. Use the controls below to refine by voice or style.
        </p>

        <div className="filters-row">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search clips..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Voice</label>
            <select
              value={filters.voice_name}
              onChange={(e) => handleFilterChange('voice_name', e.target.value)}
            >
              <option value="">All Voices</option>
              {AZURE_VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={filters.all_users}
                onChange={(e) => handleFilterChange('all_users', e.target.checked)}
              />
              Show all users' clips
            </label>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading voice clips...</div>
        ) : songs.length === 0 ? (
          <div className="empty-state">
            <p>Create your first voice clip</p>
            <button className="btn btn-primary" onClick={handleAddSong}>
              Create New Voice Clip
            </button>
          </div>
        ) : (
          <div className="songs-grid">
            {songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onView={handleViewSong}
                onDelete={handleDeleteSong}
                onDuplicate={handleDuplicateSong}
                onUpdateTitle={handleUpdateTitle}
                onRatingChange={handleRatingChange}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <SongModal
          song={editingSong}
          songs={songs}
          onClose={handleModalClose}
        />
      )}

      {showViewModal && (
        <SongViewModal
          song={viewingSong}
          onClose={() => {
            setShowViewModal(false);
            setViewingSong(null);
          }}
          onDuplicate={handleDuplicateSong}
          onEdit={handleEditSong}
        />
      )}
    </div>
  );
}

export default Home;
