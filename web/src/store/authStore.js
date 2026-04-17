import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      usuario: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          usuario: data.usuario,
        });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        return data.usuario;
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch { /* silencioso */ }
        set({ token: null, refreshToken: null, usuario: null });
        delete api.defaults.headers.common['Authorization'];
      },

      setToken: (token) => {
        set({ token });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      actualizarUsuario: (datos) => {
        set(state => ({ usuario: { ...state.usuario, ...datos } }));
      },
    }),
    {
      name: 'happy-school-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        usuario: state.usuario,
      }),
    }
  )
);
