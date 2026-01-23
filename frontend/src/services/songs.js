import api from './api';

export const getSongs = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.voice_name) {
    params.append('voice_name', filters.voice_name);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.all_users) {
    params.append('all_users', 'true');
  }
  if (filters.style_id) {
    params.append('style_id', filters.style_id);
  }
  if (filters.vocal_gender && filters.vocal_gender !== 'all') {
    params.append('vocal_gender', filters.vocal_gender);
  }
  if (filters.playlist_id) {
    params.append('playlist_id', filters.playlist_id);
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

export const updateSongRating = async (id, rating) => {
  const response = await api.put(`/songs/${id}`, { star_rating: rating });
  return response.data;
};

export const checkSongStatus = async (id) => {
  const response = await api.post(`/songs/${id}/check-status`);
  return response.data;
};

export const checkAllSubmitted = async () => {
  const response = await api.post('/songs/check-submitted');
  return response.data;
};

export const uploadSong = async (formData, onProgress) => {
  const response = await api.post('/songs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
  return response.data;
};
