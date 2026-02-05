import axios from 'axios';

// Configure the base URL. If REACT_APP_API_URL is not provided we rely on the
// CRA dev server proxy and stay relative so requests still work. We also strip
// any trailing slash or `/api` suffix so that requests defined with `/api/...`
// paths do not end up doubled.
const rawBaseUrl = process.env.REACT_APP_API_URL || '';
let cleanedBaseUrl = rawBaseUrl.trim();

if (cleanedBaseUrl) {
  cleanedBaseUrl = cleanedBaseUrl.replace(/\/+$/, '');
  if (cleanedBaseUrl.toLowerCase().endsWith('/api')) {
    cleanedBaseUrl = cleanedBaseUrl.slice(0, -4) || '/';
  }

  axios.defaults.baseURL = cleanedBaseUrl === '/' ? '' : cleanedBaseUrl;
}

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
    const headerToken = response.headers['x-csrf-token'];
    const bodyToken = response?.data?.data?.csrfToken || response?.data?.csrfToken;
    if (headerToken) {
      csrfToken = headerToken;
    } else if (bodyToken) {
      csrfToken = bodyToken;
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
    if (
      error.response &&
      error.response.status === 403 &&
      (error.response.data.error === 'invalid csrf token' ||
        error.response.data.message ===
          'Invalid or expired CSRF token. Please refresh the page and try again.')
    ) {
      // Try to get a new CSRF token and retry the request once
      return getCsrfToken()
        .then(() => {
          // Create a new request with the same config but updated CSRF token
          const config = error.config;
          if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
          }
          return axios(config);
        })
        .catch((retryError) => {
          console.error('Failed to retry request after CSRF error:', retryError);
          return Promise.reject(retryError);
        });
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const auth = {
  login: (email, password) => api.post('auth/login', { email, password }),
  logout: () => api.post('auth/logout'),
  getProfile: () => api.get('auth/me'),
  getCsrfToken: () => api.get('auth/csrf-token'),
};

// Users API calls
export const users = {
  getAll: (params) => api.get('/api/admin/users', { params }),
  getById: (id) => api.get(`/api/admin/users/${id}`),
  create: (userData) => api.post('/api/admin/users', userData),
  update: (id, userData) => api.put(`/api/admin/users/${id}`, userData),
  delete: (id) => api.delete(`/api/admin/users/${id}`),
};

export const registrationRequests = {
  getAll: (params) => api.get('/api/admin/registration-requests', { params }),
  approve: (id) => api.patch(`/api/admin/registration-requests/${id}/approve`),
  reject: (id, reason) => api.patch(`/api/admin/registration-requests/${id}/reject`, { reason }),
};

// Shipments API calls
export const shipments = {
  // Admin endpoints
  getAll: (params) => api.get('/api/admin/shipments', { params }),
  getById: (id) => api.get(`/api/admin/shipments/${id}`),
  update: (id, shipmentData) => api.put(`/api/admin/shipments/${id}`, shipmentData),
  delete: (id) => api.delete(`/api/admin/shipments/${id}`),
  changeStatus: (id, status) => api.patch(`/api/admin/shipments/${id}/status`, { status }),
  approve: (id) => api.patch(`/api/admin/shipments/${id}/approve`),
  reject: (id, reason) => api.patch(`/api/admin/shipments/${id}/reject`, { reason }),

  // Merchant endpoints
  create: (shipmentData) => api.post('/api/shipments', shipmentData),
  getMerchantShipments: (params) => api.get('/api/shipments', { params }),
  getMerchantShipmentById: (id) => api.get(`/api/shipments/${id}`),
  updateMerchantShipment: (id, shipmentData) => api.patch(`/api/shipments/${id}`, shipmentData),
  cancelShipment: (id, reason) => api.patch(`/api/shipments/${id}/cancel`, { reason }),
  updateComplianceDetails: (id, payload) => api.patch(`/api/shipments/${id}/compliance`, payload),
  getComplianceStatus: (id) => api.get(`/api/shipments/${id}/compliance`),
  uploadComplianceDocument: (id, payload) => {
    const formData = new FormData();
    formData.append('document', payload.file);
    formData.append('documentType', payload.documentType);
    formData.append('name', payload.name || payload.file?.name || 'Compliance document');
    if (payload.description) formData.append('description', payload.description);
    return api.post(`/api/shipments/${id}/compliance/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadPaymentProof: (id, payload) => {
    const formData = new FormData();
    formData.append('document', payload.file);
    if (payload.name) formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    if (payload.amount !== undefined) formData.append('amount', payload.amount);
    if (payload.currency) formData.append('currency', payload.currency);
    return api.post(`/api/shipments/${id}/payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getTracking: (id) => api.get(`/api/shipments/${id}/tracking`),
  getTrackingHistory: (id) => api.get(`/api/shipments/${id}/tracking/history`),

  // Safe create shipment with CSRF token
  safeCreateShipment: async (shipmentData) => {
    // Make sure we have a CSRF token first
    await getCsrfToken();
    // Then create the shipment
    return api.post('/api/shipments', shipmentData);
  },
};

// Applications API calls
export const applications = {
  getAll: (params) => api.get('/api/admin/applications', { params }),
  getById: (id) => api.get(`/api/admin/applications/${id}`),
  delete: (id) => api.delete(`/api/admin/applications/${id}`),
  updateStatus: (id, status) => api.patch(`/api/admin/applications/${id}/status`, { status }),
  getStats: () => api.get('/api/admin/applications/stats'),
  create: (payload) => api.post('/api/applications', payload),
  getMy: (params) => api.get('/api/applications', { params }),
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

// Reports API calls
export const reports = {
  getStatusTrends: (params) => api.get('/api/reports/shipments/status-trends', { params }),
  getRevenue: (params) => api.get('/api/reports/revenue', { params }),
  getPerformance: (params) => api.get('/api/reports/performance', { params }),
  getCustomers: (params) => api.get('/api/reports/customers', { params }),
  getEfficiency: (params) => api.get('/api/reports/efficiency', { params }),
};

// Truck owner portal API calls
export const truckOwner = {
  getAvailableShipments: (params) => api.get('/api/truck-owner/shipments/available', { params }),
  getMyShipments: (params) => api.get('/api/truck-owner/shipments', { params }),
  assignShipment: (shipmentId, payload) =>
    api.patch(`/api/truck-owner/shipments/${shipmentId}/assign`, payload),
  getDrivers: (params) => api.get('/api/truck-owner/drivers', { params }),
  getAvailableDrivers: (params) => api.get('/api/truck-owner/drivers/available', { params }),
  getAvailableTrucks: (params) => api.get('/api/truck-owner/trucks/available', { params }),
};

// Driver portal API calls
export const driver = {
  getAssignedShipments: (params) => api.get('/api/driver/shipments/assigned', { params }),
  getActiveShipments: (params) => api.get('/api/driver/shipments/active', { params }),
  updateLocation: (payload) => api.patch('/api/driver/location', payload),
  updateShipmentStatus: (shipmentId, payload) =>
    api.patch(`/api/driver/shipments/${shipmentId}/status`, payload),
  uploadProofOfDelivery: (shipmentId, payload) => {
    const formData = new FormData();
    formData.append('proof', payload.file);
    if (payload.type) formData.append('type', payload.type);
    if (payload.notes) formData.append('notes', payload.notes);
    return api.post(`/api/driver/shipments/${shipmentId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  reportIssue: (shipmentId, payload) =>
    api.post(`/api/driver/shipments/${shipmentId}/issues`, payload),
};

export default api;
