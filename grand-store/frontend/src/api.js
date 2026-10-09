import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultBaseUrl = isLocalhost ? 'http://localhost:5015' : 'https://api.grandstoreglobal.com';
const apiBaseUrl = import.meta.env.VITE_API_URL?.includes('localhost') && !isLocalhost 
  ? 'https://api.grandstoreglobal.com' 
  : (import.meta.env.VITE_API_URL || defaultBaseUrl);

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo && userInfo.token) {
          config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
      }
    } catch (e) {
      console.error('Failed to parse userInfo for auth token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the API explicitly rejects authorization, clear the broken session
      localStorage.removeItem('userInfo');
      // Dispatch a custom event so the React app can pick it up without a hard reload if needed,
      // or just hard reload to clear React state.
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
