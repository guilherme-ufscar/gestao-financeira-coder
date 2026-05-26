import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../store/auth';

const API_URL = Capacitor.isNativePlatform()
  ? 'https://gestaofinanceira.codermaster.com.br/api'
  : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(API_URL + '/auth/refresh', {}, { withCredentials: true });
        useAuthStore.getState().setAuth(data.user, data.token);
        originalRequest.headers.Authorization = 'Bearer ' + data.token;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
