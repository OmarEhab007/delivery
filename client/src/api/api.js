import axios from 'axios';

// Set base URL if needed
// axios.defaults.baseURL = 'http://localhost:5000/api';

// Create an instance with default config
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiration and other common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear local storage
      localStorage.removeItem('auth_token');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const auth = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/me'),
};

// Users API calls
export const users = {
  getAll: (params) => api.get('/api/admin/users', { params }),
  getById: (id) => api.get(`/api/admin/users/${id}`),
  create: (userData) => api.post('/api/admin/users', userData),
  update: (id, userData) => api.put(`/api/admin/users/${id}`, userData),
  delete: (id) => api.delete(`/api/admin/users/${id}`),
};

// Shipments API calls
export const shipments = {
  getAll: (params) => api.get('/api/admin/shipments', { params }),
  getById: (id) => api.get(`/api/admin/shipments/${id}`),
  update: (id, shipmentData) => api.put(`/api/admin/shipments/${id}`, shipmentData),
  delete: (id) => api.delete(`/api/admin/shipments/${id}`),
  changeStatus: (id, status) => api.patch(`/api/admin/shipments/${id}/status`, { status }),
};

// Applications API calls
export const applications = {
  getAll: (params) => api.get('/api/admin/applications', { params }),
  getById: (id) => api.get(`/api/admin/applications/${id}`),
  delete: (id) => api.delete(`/api/admin/applications/${id}`),
  updateStatus: (id, status) => api.patch(`/api/admin/applications/${id}/status`, { status }),
  getStats: () => api.get('/api/admin/applications/stats'),
};

// Trucks API calls
export const trucks = {
  getAll: (params) => api.get('/api/admin/trucks', { params }),
  getById: (id) => api.get(`/api/admin/trucks/${id}`),
  create: (truckData) => api.post('/api/admin/trucks', truckData),
  update: (id, truckData) => api.put(`/api/admin/trucks/${id}`, truckData),
  delete: (id) => api.delete(`/api/admin/trucks/${id}`),
  changeStatus: (id, status) => api.patch(`/api/admin/trucks/${id}/status`, { status }),
};

// Dashboard API calls
export const dashboard = {
  getStats: () => api.get('/api/admin/dashboard'),
};

export default api; 