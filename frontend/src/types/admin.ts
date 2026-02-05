import type { User, Shipment, Application, Truck, Document } from './entities';
import type { UserRole } from './api';

export interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    merchants: number;
    truckOwners: number;
    drivers: number;
    increase: number;
  };
  trucks: {
    total: number;
    available: number;
    increase: number;
  };
  shipments: {
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
    increase: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    increase: number;
  };
  recentActivity?: Array<{
    id: string;
    type: string;
    action: string;
    user: string;
    time: string;
  }>;
}

export type AdminDashboardResponse = ApiSuccessResponse<AdminDashboardStats>;

export type AdminUsersResponse = ApiSuccessResponse<{
  users: User[];
  pagination: Pagination;
}>;

export interface RegistrationRequestPayload {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  companyAddress?: string;
  licenseNumber?: string;
  ownerId?: string;
}

export interface RegistrationRequest {
  _id: string;
  role: 'Merchant' | 'TruckOwner' | 'Driver';
  state: 'PENDING' | 'APPROVED' | 'REJECTED';
  payload: RegistrationRequestPayload;
  submittedBy?: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  rejectionReason?: string;
  createdAt: string;
}

export type RegistrationRequestsResponse = ApiSuccessResponse<{
  requests: RegistrationRequest[];
  pagination: Pagination;
}>;

export type AdminShipmentsResponse = ApiSuccessResponse<{
  shipments: Shipment[];
  pagination: Pagination;
}>;

export type AdminApplicationsResponse = ApiSuccessResponse<{
  applications: Application[];
  pagination: Pagination;
}>;

export type AdminTrucksResponse = ApiSuccessResponse<{
  trucks: Truck[];
  pagination: Pagination;
}>;

export type AdminDocumentsResponse = ApiSuccessResponse<{
  documents: Document[];
  pagination?: Pagination;
}>;
