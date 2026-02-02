import axios from 'axios';

const api = axios.create({
    baseURL: 'https://toki-backend-78ds.onrender.com/api',
});

import toast from 'react-hot-toast';

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        let message = 'Something went wrong';

        if (error.response?.data) {
            if (error.response.data.message) {
                message = error.response.data.message;
            } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
                // Handle validation errors (express-validator array)
                message = error.response.data.errors.map(err => err.msg).join(', ');
            } else if (error.response.data.error) {
                message = error.response.data.error;
            }
        } else if (error.message) {
            message = error.message;
        }

        toast.error(message);
        return Promise.reject(error);
    }
);

export default api;
