import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: adjuntar token si existe en localStorage
api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('happy-school-auth') || '{}');
  const token = auth?.state?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: refresh automático si 401 TOKEN_EXPIRED
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const auth = JSON.parse(localStorage.getItem('happy-school-auth') || '{}');
        const refreshToken = auth?.state?.refreshToken;
        const { data } = await api.post('/auth/refresh', { refreshToken });

        // Actualizar store
        const stored = JSON.parse(localStorage.getItem('happy-school-auth'));
        stored.state.token = data.accessToken;
        stored.state.refreshToken = data.refreshToken;
        localStorage.setItem('happy-school-auth', JSON.stringify(stored));

        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('happy-school-auth');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
