import api from './api';

export const getStyles = async () => {
  const response = await api.get('/styles/');
  return response.data;
};

export const getStyle = async (id) => {
  const response = await api.get(`/styles/${id}`);
  return response.data.style;
};

export const createStyle = async (styleData) => {
  const response = await api.post('/styles/', styleData);
  return response.data;
};

export const updateStyle = async (id, styleData) => {
  const response = await api.put(`/styles/${id}`, styleData);
  return response.data;
};

export const deleteStyle = async (id) => {
  const response = await api.delete(`/styles/${id}`);
  return response.data;
};
