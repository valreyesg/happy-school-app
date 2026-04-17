import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

// Adaptador para SecureStore con zustand persist
const secureStorage = {
  getItem: async (key) => {
    const val = await SecureStore.getItemAsync(key);
    return val ? val : null;
  },
  setItem: async (key, value) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      usuario: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        set({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          usuario: data.usuario,
        });
        return data.usuario;
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch {}
        delete api.defaults.headers.common['Authorization'];
        set({ token: null, refreshToken: null, usuario: null });
      },

      registrarPushToken: async () => {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') return;
          const { data: fcmToken } = await Notifications.getExpoPushTokenAsync();
          const { token } = get();
          if (token && fcmToken) {
            await api.post('/notificaciones/registrar-token', { fcmToken });
          }
        } catch {}
      },

      setToken: (token) => {
        set({ token });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },
    }),
    {
      name: 'happy-school-auth',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
