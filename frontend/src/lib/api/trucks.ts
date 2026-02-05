/**
 * Trucks API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  CreateTruckRequest,
  GetTrucksParams,
  UpdateTruckRequest,
  AssignDriverToTruckRequest,
  RecordMaintenanceRequest,
  UpdateInsuranceRequest,
  UpdateRegistrationRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';
import type { Truck } from '@/types/entities';

export const trucksApi = {
  async list(params?: GetTrucksParams): Promise<PaginatedResponse<Truck>> {
    return apiClient.get<PaginatedResponse<Truck>>(
      API_ENDPOINTS.trucks.list,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async create(data: CreateTruckRequest): Promise<ApiResponse<Truck>> {
    return apiClient.post<ApiResponse<Truck>>(API_ENDPOINTS.trucks.create, data);
  },

  async get(id: string): Promise<ApiResponse<Truck>> {
    return apiClient.get<ApiResponse<Truck>>(API_ENDPOINTS.trucks.get(id));
  },

  async update(id: string, data: UpdateTruckRequest): Promise<ApiResponse<Truck>> {
    return apiClient.put<ApiResponse<Truck>>(API_ENDPOINTS.trucks.update(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.trucks.delete(id));
  },

  async assignDriver(id: string, data: AssignDriverToTruckRequest): Promise<ApiResponse<Truck>> {
    return apiClient.post<ApiResponse<Truck>>(API_ENDPOINTS.trucks.assignDriver(id), data);
  },

  async unassignDriver(id: string): Promise<ApiResponse<Truck>> {
    return apiClient.post<ApiResponse<Truck>>(API_ENDPOINTS.trucks.unassignDriver(id));
  },

  async recordMaintenance(id: string, data: RecordMaintenanceRequest): Promise<ApiResponse<Truck>> {
    return apiClient.post<ApiResponse<Truck>>(API_ENDPOINTS.trucks.maintenance(id), data);
  },

  async updateInsurance(id: string, data: UpdateInsuranceRequest): Promise<ApiResponse<Truck>> {
    return apiClient.patch<ApiResponse<Truck>>(API_ENDPOINTS.trucks.insurance(id), data);
  },

  async updateRegistration(
    id: string,
    data: UpdateRegistrationRequest
  ): Promise<ApiResponse<Truck>> {
    return apiClient.patch<ApiResponse<Truck>>(API_ENDPOINTS.trucks.registration(id), data);
  },

  async getMyTrucks(): Promise<ApiResponse<Truck[]>> {
    return apiClient.get<ApiResponse<Truck[]>>(API_ENDPOINTS.trucks.myTrucks);
  },
};

export default trucksApi;
