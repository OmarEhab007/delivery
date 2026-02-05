/**
 * API Endpoints Configuration
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    registerMerchant: '/auth/register/merchant',
    registerTruckOwner: '/auth/register/truckOwner',
    registerDriver: '/auth/register/driver',
    registerAdmin: '/auth/register/admin',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    csrf: '/auth/csrf-token',
    me: '/auth/me',
    requestOtp: '/auth/otp/request',
    verifyOtp: '/auth/otp/verify',
  },

  // Users
  users: {
    list: '/users',
    get: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    profile: '/users/profile',
    documents: (id: string) => `/users/${id}/documents`,
  },

  // Drivers (subset of users with driver-specific actions)
  drivers: {
    list: '/drivers',
    get: (id: string) => `/drivers/${id}`,
    updateStatus: (id: string) => `/drivers/${id}/status`,
    updateLocation: (id: string) => `/drivers/${id}/location`,
    checkIn: (id: string) => `/drivers/${id}/check-in`,
    checkOut: (id: string) => `/drivers/${id}/check-out`,
    assignedShipments: (id: string) => `/drivers/${id}/shipments`,
  },

  // Shipments
  shipments: {
    list: '/shipments',
    create: '/shipments',
    get: (id: string) => `/shipments/${id}`,
    update: (id: string) => `/shipments/${id}`,
    delete: (id: string) => `/shipments/${id}`,
    updateStatus: (id: string) => `/shipments/${id}/status`,
    approve: (id: string) => `/shipments/${id}/approve`,
    assign: (id: string) => `/shipments/${id}/assign`,
    startDelivery: (id: string) => `/shipments/${id}/start`,
    completeDelivery: (id: string) => `/shipments/${id}/complete`,
    updateTracking: (id: string) => `/shipments/${id}/tracking`,
    trackingHistory: (id: string) => `/shipments/${id}/tracking/history`,
    timeline: (id: string) => `/shipments/${id}/timeline`,
    reportIssue: (id: string) => `/shipments/${id}/issues`,
    compliance: (id: string) => `/shipments/${id}/compliance`,
    documents: (id: string) => `/shipments/${id}/documents`,
    applications: (id: string) => `/shipments/${id}/applications`,
  },

  // Applications (Bids)
  applications: {
    list: '/applications',
    create: '/applications',
    get: (id: string) => `/applications/${id}`,
    update: (id: string) => `/applications/${id}`,
    delete: (id: string) => `/applications/${id}`,
    accept: (id: string) => `/applications/${id}/accept`,
    reject: (id: string) => `/applications/${id}/reject`,
    cancel: (id: string) => `/applications/${id}/cancel`,
    myApplications: '/applications/my',
  },

  // Trucks
  trucks: {
    list: '/trucks',
    create: '/trucks',
    get: (id: string) => `/trucks/${id}`,
    update: (id: string) => `/trucks/${id}`,
    delete: (id: string) => `/trucks/${id}`,
    assignDriver: (id: string) => `/trucks/${id}/assign-driver`,
    unassignDriver: (id: string) => `/trucks/${id}/unassign-driver`,
    maintenance: (id: string) => `/trucks/${id}/maintenance`,
    insurance: (id: string) => `/trucks/${id}/insurance`,
    registration: (id: string) => `/trucks/${id}/registration`,
    documents: (id: string) => `/trucks/${id}/documents`,
    myTrucks: '/trucks/my',
  },

  // Documents
  documents: {
    list: '/documents',
    upload: '/documents/upload',
    get: (id: string) => `/documents/${id}`,
    download: (id: string) => `/documents/${id}/download`,
    verify: (id: string) => `/documents/${id}/verify`,
    byEntity: (entityType: string, entityId: string) => `/documents/entity/${entityType}/${entityId}`,
    delete: (id: string) => `/documents/${id}`,
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    user: (id: string) => `/admin/users/${id}`,
    shipments: '/admin/shipments',
    shipment: (id: string) => `/admin/shipments/${id}`,
    approveShipment: (id: string) => `/admin/shipments/${id}/approve`,
    rejectShipment: (id: string) => `/admin/shipments/${id}/reject`,
    assignShipment: (id: string) => `/admin/shipments/${id}/assign`,
    updateShipmentStatus: (id: string) => `/admin/shipments/${id}/status`,
    assignBroker: (id: string) => `/admin/shipments/${id}/broker`,
    registrationRequests: '/admin/registration-requests',
    approveRegistration: (id: string) => `/admin/registration-requests/${id}/approve`,
    rejectRegistration: (id: string) => `/admin/registration-requests/${id}/reject`,
    applications: '/admin/applications',
    application: (id: string) => `/admin/applications/${id}`,
    updateApplicationStatus: (id: string) => `/admin/applications/${id}/status`,
    applicationStats: '/admin/applications/stats',
    trucks: '/admin/trucks',
    truck: (id: string) => `/admin/trucks/${id}`,
    updateTruckStatus: (id: string) => `/admin/trucks/${id}/status`,
    brokers: '/admin/brokers',
    broker: (id: string) => `/admin/brokers/${id}`,
  },

  // Analytics & Reporting
  analytics: {
    merchantKPIs: '/analytics/merchant/kpis',
    merchantLanes: '/analytics/merchant/lanes',
    truckOwnerStats: '/analytics/truck-owner/stats',
    truckPerformance: '/analytics/truck-owner/trucks',
  },

  // Health & System
  health: {
    check: '/health',
    detailed: '/health/detailed',
    db: '/health/db',
  },
} as const;
