import api from './api';

export const getSongs = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.style_id) {
    params.append('style_id', filters.style_id);
  }
  if (filters.vocal_gender && filters.vocal_gender !== 'all') {
    params.append('vocal_gender', filters.vocal_gender);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.all_users) {
    params.append('all_users', 'true');
  }

  const response = await api.get(`/songs/?${params.toString()}`);
  return response.data;
};

export const getSong = async (id) => {
  const response = await api.get(`/songs/${id}`);
  return response.data.song;
};

export const createSong = async (songData) => {
  const response = await api.post('/songs/', songData);
  return response.data;
};

export const updateSong = async (id, songData) => {
  const response = await api.put(`/songs/${id}`, songData);
  return response.data;
};

export const deleteSong = async (id) => {
  const response = await api.delete(`/songs/${id}`);
  return response.data;
};

export const getSongStats = async (allUsers = false) => {
  const params = allUsers ? '?all_users=true' : '';
  const response = await api.get(`/songs/stats${params}`);
  return response.data;
};

export const recreateSong = async (id) => {
  const response = await api.post(`/songs/${id}/recreate`);
  return response.data;
};
