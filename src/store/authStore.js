import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, accessToken, refreshToken } = response.data;

            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
            return true;
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Login failed' });
            return false;
        }
    },

    register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/register', { username, email, password });
            const { user, accessToken, refreshToken } = response.data;

            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
            return true;
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Registration failed' });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    }
}));

export default useAuthStore;
