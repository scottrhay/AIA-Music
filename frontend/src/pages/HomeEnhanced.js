import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSongs, getSongStats, deleteSong } from '../services/songs';
import { getStyles } from '../services/styles';
import StudioHeader from '../components/Studio/StudioHeader';
import ControlBar from '../components/Studio/ControlBar';
import SongGrid from '../components/Studio/SongGrid';
import SongCardEnhanced from '../components/Studio/SongCardEnhanced';
import SongModal from '../components/SongModal';
import SongViewModal from '../components/SongViewModal';
import '../theme/theme.css';
import './HomeEnhanced.css';

function HomeEnhanced({ onLogout }) {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [styles, setStyles] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSong, setViewingSong] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    style_id: '',
    vocal_gender: 'all',
    search: '',
    all_users: false,
  });

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

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      style_id: '',
      vocal_gender: 'all',
      search: '',
      all_users: false,
    });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.style_id || filters.vocal_gender !== 'all' || filters.all_users;
  }, [filters]);

  return (
    <div className="home-enhanced">
      <StudioHeader
        stats={stats}
        onAddSong={handleAddSong}
        onManageStyles={() => navigate('/styles')}
        onLogout={onLogout}
      />

      <main className="home-enhanced__content">
        <div className="home-enhanced__container">
          <ControlBar
            filters={filters}
            onFilterChange={handleFilterChange}
            styles={styles}
            onClearFilters={handleClearFilters}
          />

          <SongGrid
            songs={songs}
            loading={loading}
            onAddSong={handleAddSong}
            hasFilters={hasActiveFilters}
          >
            {songs.map((song) => (
              <SongCardEnhanced
                key={song.id}
                song={song}
                onView={handleViewSong}
                onDelete={handleDeleteSong}
                onDuplicate={handleDuplicateSong}
              />
            ))}
          </SongGrid>
        </div>
      </main>

      {showModal && (
        <SongModal
          song={editingSong}
          styles={styles}
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

export default HomeEnhanced;
