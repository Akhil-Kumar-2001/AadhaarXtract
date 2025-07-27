import axios from 'axios';

const API_URI = import.meta.env.VITE_API_URI;
console.log(API_URI)


const api = axios.create({
  baseURL: API_URI, // Change to your backend URL
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export default api;


// Request interceptor: modify outgoing requests
api.interceptors.request.use(
  config => {
    // For example, add auth token or log request
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: handle global errors, transform responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error: e.g., logout or redirect
      console.error('Unauthorized, logging out...');
    }
    return Promise.reject(error);
  }
);
