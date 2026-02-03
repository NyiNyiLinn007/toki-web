// src/lib/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Base URL: use env var for Vercel, fallback to Render URL
const baseURL = import.meta.env.VITE_API_URL || 'https://toki-backend-78ds.onrender.com/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s timeout to fail fast
  // withCredentials: true, // enable if you use cookie-based auth
});

// Request interceptor: attach Bearer token from localStorage (if exists)
api.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    config.headers = config.headers || {};
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Optionally delete Authorization if no token
        delete config.headers['Authorization'];
      }
    } catch (e) {
      // localStorage might throw in some environments — silently ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to extract readable error message from various backend shapes
function extractMessageFromError(error) {
  // Default
  let message = 'Something went wrong';

  // Axios response from server
  const resp = error?.response;
  if (resp?.data) {
    const data = resp.data;

    // Common patterns:
    // { message: "..." }
    if (typeof data.message === 'string' && data.message.trim()) {
      message = data.message;
    }
    // { error: "..." }
    else if (typeof data.error === 'string' && data.error.trim()) {
      message = data.error;
    }
    // { errors: [{ msg: '...' }, { message: '...' }] }
    else if (Array.isArray(data.errors) && data.errors.length) {
      message = data.errors
        .map((e) => e?.msg || e?.message || (typeof e === 'string' ? e : null))
        .filter(Boolean)
        .join(', ');
    }
    // fallback: if data is a string
    else if (typeof data === 'string' && data.trim()) {
      message = data;
    }
    // else if server returned a status text
    else if (resp.status && resp.statusText) {
      message = `${resp.status} ${resp.statusText}`;
    }
  }
  // No response (network or CORS)
  else if (error?.message) {
    // error.message may contain "Network Error" or timeout messages
    message = error.message;
  }

  return message;
}

// Response interceptor: show toast on error and rethrow
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = extractMessageFromError(error);

    // Friendly user notification
    toast.error(message);

    // Optional: handle auth-specific flows (uncomment if you want automatic handling)
    // if (error?.response?.status === 401) {
    //   // example: clear stored token and optionally redirect to login
    //   try { localStorage.removeItem('token'); } catch (e) {}
    //   // window.location.href = '/login';
    // }

    return Promise.reject(error);
  }
);

export default api;
