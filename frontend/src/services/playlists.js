import api from './api';

export const getPlaylists = async () => {
  const response = await api.get('/playlists/');
  return response.data;
};

export const getPlaylist = async (id) => {
  const response = await api.get(`/playlists/${id}`);
  return response.data.playlist;
};

export const createPlaylist = async (playlistData) => {
  const response = await api.post('/playlists/', playlistData);
  return response.data;
};

export const updatePlaylist = async (id, playlistData) => {
  const response = await api.put(`/playlists/${id}`, playlistData);
  return response.data;
};

export const deletePlaylist = async (id) => {
  const response = await api.delete(`/playlists/${id}`);
  return response.data;
};

export const addSongToPlaylist = async (playlistId, songId) => {
  const response = await api.post(`/playlists/${playlistId}/songs`, { song_id: songId });
  return response.data;
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  const response = await api.delete(`/playlists/${playlistId}/songs/${songId}`);
  return response.data;
};

export const assignSongToPlaylists = async (songId, playlistIds) => {
  const response = await api.post(`/playlists/song/${songId}/assign`, { playlist_ids: playlistIds });
  return response.data;
};

export const getSongPlaylists = async (songId) => {
  const response = await api.get(`/playlists/song/${songId}/playlists`);
  return response.data;
};
