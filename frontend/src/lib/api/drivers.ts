/**
 * Drivers API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  GetUsersParams,
  UpdateDriverStatusRequest,
  UpdateDriverLocationRequest,
  DriverCheckInRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';
import type { User, Shipment } from '@/types/entities';

export const driversApi = {
  async list(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>(
      API_ENDPOINTS.drivers.list,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async get(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>(API_ENDPOINTS.drivers.get(id));
  },

  async updateStatus(id: string, data: UpdateDriverStatusRequest): Promise<ApiResponse<User>> {
    return apiClient.patch<ApiResponse<User>>(API_ENDPOINTS.drivers.updateStatus(id), data);
  },

  async updateLocation(id: string, data: UpdateDriverLocationRequest): Promise<ApiResponse<User>> {
    return apiClient.patch<ApiResponse<User>>(API_ENDPOINTS.drivers.updateLocation(id), data);
  },

  async checkIn(id: string, data: DriverCheckInRequest): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.drivers.checkIn(id), data);
  },

  async checkOut(id: string): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.drivers.checkOut(id));
  },

  async getAssignedShipments(id: string): Promise<ApiResponse<Shipment[]>> {
    return apiClient.get<ApiResponse<Shipment[]>>(API_ENDPOINTS.drivers.assignedShipments(id));
  },
};

export default driversApi;
