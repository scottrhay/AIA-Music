import api from './api';

const TOKEN_KEY = 'sunoapp_token';
const USER_KEY = 'sunoapp_user';

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  const { access_token, user } = response.data;

  localStorage.setItem(TOKEN_KEY, access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { token: access_token, user };
};

export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.user;
};
