import { create } from 'zustand';
import api from '@/services/api';

export const useAppConfigStore = create((set) => ({
  whatsappEnabled: false,
  configCargada: false,

  cargarConfig: async () => {
    try {
      const { data } = await api.get('/config/whatsapp');
      set({ whatsappEnabled: data.enabled === true, configCargada: true });
    } catch {
      // fail-safe: si el endpoint falla, WhatsApp queda deshabilitado
      set({ whatsappEnabled: false, configCargada: true });
    }
  },
}));
