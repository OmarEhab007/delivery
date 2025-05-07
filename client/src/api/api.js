import axios from 'axios';

// Set base URL
axios.defaults.baseURL = 'http://localhost:3000';

// Create an instance with default config
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Store CSRF token
let csrfToken = '';

// Function to get a CSRF token
export const getCsrfToken = async () => {
  try {
    // Make a GET request to a safe endpoint that will return a CSRF token
    const response = await api.get('/api/auth/csrf-token');
    if (response.headers['x-csrf-token']) {
      csrfToken = response.headers['x-csrf-token'];
    }
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

// Request interceptor - add auth header if token exists
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for non-GET requests if available
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiration and other common errors
api.interceptors.response.use(
  (response) => {
    // Save CSRF token if it's in the response headers
    if (response.headers && response.headers['x-csrf-token']) {
      csrfToken = response.headers['x-csrf-token'];
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear local storage
      localStorage.removeItem('auth_token');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    // Special handling for CSRF errors
    if (error.response && 
        error.response.status === 403 && 
        (error.response.data.error === 'invalid csrf token' || 
         error.response.data.message === 'Invalid or expired CSRF token. Please refresh the page and try again.')) {
      // Try to get a new CSRF token and retry the request once
      return getCsrfToken().then(() => {
        // Create a new request with the same config but updated CSRF token
        const config = error.config;
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
        return axios(config);
      }).catch(retryError => {
        console.error('Failed to retry request after CSRF error:', retryError);
        return Promise.reject(retryError);
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const auth = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/me'),
  getCsrfToken: () => api.get('/api/auth/csrf-token'),
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
  // Admin endpoints
  getAll: (params) => api.get('/api/admin/shipments', { params }),
  getById: (id) => api.get(`/api/admin/shipments/${id}`),
  update: (id, shipmentData) => api.put(`/api/admin/shipments/${id}`, shipmentData),
  delete: (id) => api.delete(`/api/admin/shipments/${id}`),
  changeStatus: (id, status) => api.patch(`/api/admin/shipments/${id}/status`, { status }),
  
  // Merchant endpoints
  create: (shipmentData) => api.post('/api/shipments', shipmentData),
  getMerchantShipments: (params) => api.get('/api/shipments', { params }),
  getMerchantShipmentById: (id) => api.get(`/api/shipments/${id}`),
  updateMerchantShipment: (id, shipmentData) => api.patch(`/api/shipments/${id}`, shipmentData),
  cancelShipment: (id, reason) => api.patch(`/api/shipments/${id}/cancel`, { reason }),
  
  // Safe create shipment with CSRF token
  safeCreateShipment: async (shipmentData) => {
    // Make sure we have a CSRF token first
    await getCsrfToken();
    // Then create the shipment
    return api.post('/api/shipments', shipmentData);
  }
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