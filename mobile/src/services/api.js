import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = __DEV__
  ? 'http://192.168.1.100:3000/api' // Cambiar a IP de tu máquina en desarrollo
  : 'https://tu-dominio-produccion.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const stored = await SecureStore.getItemAsync('happy-school-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry &&
      !isRefreshing
    ) {
      original._retry = true;
      isRefreshing = true;
      try {
        const stored = await SecureStore.getItemAsync('happy-school-auth');
        const { state } = JSON.parse(stored);
        const { data } = await api.post('/auth/refresh', { refreshToken: state.refreshToken });

        const updated = JSON.parse(stored);
        updated.state.token = data.accessToken;
        updated.state.refreshToken = data.refreshToken;
        await SecureStore.setItemAsync('happy-school-auth', JSON.stringify(updated));

        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('happy-school-auth');
        // Redirigir a login se maneja en el _layout
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
