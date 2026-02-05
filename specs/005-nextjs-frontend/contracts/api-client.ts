/**
 * API Client Specification for Next.js Frontend
 * Feature: 005-nextjs-frontend
 *
 * This file defines the API client interface and endpoint structure.
 */

import type {
  // Auth
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  // User
  GetUsersParams,
  UpdateUserRequest,
  UpdateDriverStatusRequest,
  UpdateDriverLocationRequest,
  DriverCheckInRequest,
  // Shipment
  CreateShipmentRequest,
  GetShipmentsParams,
  UpdateShipmentStatusRequest,
  ApproveShipmentRequest,
  AssignShipmentRequest,
  StartDeliveryRequest,
  CompleteDeliveryRequest,
  ReportIssueRequest,
  UpdateComplianceRequest,
  UpdateTrackingRequest,
  // Application
  CreateApplicationRequest,
  GetApplicationsParams,
  UpdateApplicationRequest,
  RejectApplicationRequest,
  // Truck
  CreateTruckRequest,
  GetTrucksParams,
  UpdateTruckRequest,
  AssignDriverToTruckRequest,
  RecordMaintenanceRequest,
  UpdateInsuranceRequest,
  UpdateRegistrationRequest,
  // Document
  UploadDocumentRequest,
  GetDocumentsParams,
  VerifyDocumentRequest,
  // Admin
  GetDashboardStatsResponse,
  ApproveUserRequest,
  GetPendingApprovalsParams,
  // Analytics
  GetMerchantKPIsParams,
  MerchantKPIsResponse,
  GetTruckOwnerAnalyticsParams,
  TruckOwnerAnalyticsResponse,
  // Generic
  ApiResponse,
  PaginatedResponse,
} from './api-types';

// =============================================================================
// BASE CONFIGURATION
// =============================================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh-token',
    me: '/auth/me',
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
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
    delete: (id: string) => `/documents/${id}`,
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    approveUser: (id: string) => `/admin/users/${id}/approve`,
    shipments: '/admin/shipments',
    approveShipment: (id: string) => `/admin/shipments/${id}/approve`,
    pendingApprovals: '/admin/pending-approvals',
    metrics: '/admin/metrics',
    reports: '/admin/reports',
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

// =============================================================================
// API CLIENT INTERFACE
// =============================================================================

export interface ApiClientConfig {
  baseURL: string;
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
  onError: (error: Error) => void;
}

/**
 * API Client Interface
 *
 * Implementation should use fetch or axios with:
 * - Automatic token injection
 * - Token refresh on 401
 * - Error handling and transformation
 * - Request/response logging in development
 */
export interface ApiClient {
  // Auth
  auth: {
    login(data: LoginRequest): Promise<LoginResponse>;
    register(data: RegisterRequest): Promise<RegisterResponse>;
    logout(): Promise<void>;
    refresh(data: RefreshTokenRequest): Promise<RefreshTokenResponse>;
    me(): Promise<ApiResponse<User>>;
  };

  // Users
  users: {
    list(params?: GetUsersParams): Promise<PaginatedResponse<User>>;
    get(id: string): Promise<ApiResponse<User>>;
    update(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>>;
    delete(id: string): Promise<ApiResponse<void>>;
    getProfile(): Promise<ApiResponse<User>>;
  };

  // Drivers
  drivers: {
    list(params?: GetUsersParams): Promise<PaginatedResponse<User>>;
    get(id: string): Promise<ApiResponse<User>>;
    updateStatus(id: string, data: UpdateDriverStatusRequest): Promise<ApiResponse<User>>;
    updateLocation(id: string, data: UpdateDriverLocationRequest): Promise<ApiResponse<User>>;
    checkIn(id: string, data: DriverCheckInRequest): Promise<ApiResponse<void>>;
    checkOut(id: string): Promise<ApiResponse<void>>;
    getAssignedShipments(id: string): Promise<ApiResponse<Shipment[]>>;
  };

  // Shipments
  shipments: {
    list(params?: GetShipmentsParams): Promise<PaginatedResponse<Shipment>>;
    create(data: CreateShipmentRequest): Promise<ApiResponse<Shipment>>;
    get(id: string): Promise<ApiResponse<Shipment>>;
    update(id: string, data: Partial<CreateShipmentRequest>): Promise<ApiResponse<Shipment>>;
    delete(id: string): Promise<ApiResponse<void>>;
    updateStatus(id: string, data: UpdateShipmentStatusRequest): Promise<ApiResponse<Shipment>>;
    approve(id: string, data: ApproveShipmentRequest): Promise<ApiResponse<Shipment>>;
    assign(id: string, data: AssignShipmentRequest): Promise<ApiResponse<Shipment>>;
    startDelivery(id: string, data: StartDeliveryRequest): Promise<ApiResponse<Shipment>>;
    completeDelivery(id: string, data: CompleteDeliveryRequest): Promise<ApiResponse<Shipment>>;
    updateTracking(id: string, data: UpdateTrackingRequest): Promise<ApiResponse<Shipment>>;
    getTrackingHistory(id: string): Promise<ApiResponse<TrackingPoint[]>>;
    getTimeline(id: string): Promise<ApiResponse<TimelineEntry[]>>;
    reportIssue(id: string, data: ReportIssueRequest): Promise<ApiResponse<Shipment>>;
    updateCompliance(id: string, data: UpdateComplianceRequest): Promise<ApiResponse<Shipment>>;
    getApplications(id: string): Promise<ApiResponse<Application[]>>;
  };

  // Applications
  applications: {
    list(params?: GetApplicationsParams): Promise<PaginatedResponse<Application>>;
    create(data: CreateApplicationRequest): Promise<ApiResponse<Application>>;
    get(id: string): Promise<ApiResponse<Application>>;
    update(id: string, data: UpdateApplicationRequest): Promise<ApiResponse<Application>>;
    delete(id: string): Promise<ApiResponse<void>>;
    accept(id: string): Promise<ApiResponse<Application>>;
    reject(id: string, data: RejectApplicationRequest): Promise<ApiResponse<Application>>;
    cancel(id: string): Promise<ApiResponse<Application>>;
    getMyApplications(params?: GetApplicationsParams): Promise<PaginatedResponse<Application>>;
  };

  // Trucks
  trucks: {
    list(params?: GetTrucksParams): Promise<PaginatedResponse<Truck>>;
    create(data: CreateTruckRequest): Promise<ApiResponse<Truck>>;
    get(id: string): Promise<ApiResponse<Truck>>;
    update(id: string, data: UpdateTruckRequest): Promise<ApiResponse<Truck>>;
    delete(id: string): Promise<ApiResponse<void>>;
    assignDriver(id: string, data: AssignDriverToTruckRequest): Promise<ApiResponse<Truck>>;
    unassignDriver(id: string): Promise<ApiResponse<Truck>>;
    recordMaintenance(id: string, data: RecordMaintenanceRequest): Promise<ApiResponse<Truck>>;
    updateInsurance(id: string, data: UpdateInsuranceRequest): Promise<ApiResponse<Truck>>;
    updateRegistration(id: string, data: UpdateRegistrationRequest): Promise<ApiResponse<Truck>>;
    getMyTrucks(): Promise<ApiResponse<Truck[]>>;
  };

  // Documents
  documents: {
    list(params?: GetDocumentsParams): Promise<PaginatedResponse<Document>>;
    upload(data: FormData): Promise<ApiResponse<Document>>;
    get(id: string): Promise<ApiResponse<Document>>;
    download(id: string): Promise<Blob>;
    verify(id: string, data: VerifyDocumentRequest): Promise<ApiResponse<Document>>;
    delete(id: string): Promise<ApiResponse<void>>;
  };

  // Admin
  admin: {
    getDashboard(): Promise<GetDashboardStatsResponse>;
    getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>>;
    approveUser(id: string, data: ApproveUserRequest): Promise<ApiResponse<User>>;
    getShipments(params?: GetShipmentsParams): Promise<PaginatedResponse<Shipment>>;
    approveShipment(id: string, data: ApproveShipmentRequest): Promise<ApiResponse<Shipment>>;
    getPendingApprovals(params?: GetPendingApprovalsParams): Promise<ApiResponse<PendingApprovals>>;
  };

  // Analytics
  analytics: {
    getMerchantKPIs(params?: GetMerchantKPIsParams): Promise<MerchantKPIsResponse>;
    getTruckOwnerAnalytics(params?: GetTruckOwnerAnalyticsParams): Promise<TruckOwnerAnalyticsResponse>;
  };
}

// =============================================================================
// PLACEHOLDER TYPES (defined in data-model.md)
// =============================================================================

// These are imported from data-model types in actual implementation
type User = import('./api-types').ApiResponse<unknown>['data'];
type Shipment = import('./api-types').ApiResponse<unknown>['data'];
type Application = import('./api-types').ApiResponse<unknown>['data'];
type Truck = import('./api-types').ApiResponse<unknown>['data'];
type Document = import('./api-types').ApiResponse<unknown>['data'];
type TrackingPoint = unknown;
type TimelineEntry = unknown;
type PendingApprovals = {
  users: User[];
  shipments: Shipment[];
  documents: Document[];
};
