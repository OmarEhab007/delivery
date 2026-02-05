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
import { normalizeTruck, normalizeTrucks } from './normalize';

export const trucksApi = {
  async list(params?: GetTrucksParams): Promise<PaginatedResponse<Truck>> {
    const response = await apiClient.get<ApiResponse<{ trucks: Truck[] }>>(
      API_ENDPOINTS.trucks.list,
      params as Record<string, string | number | boolean | undefined>
    );
    const trucks = normalizeTrucks(response.data?.trucks || []);
    return {
      success: true,
      data: trucks,
      pagination: {
        page: 1,
        limit: trucks.length,
        total: trucks.length,
        totalPages: 1,
      },
    };
  },

  async create(data: CreateTruckRequest): Promise<ApiResponse<Truck>> {
    const response = await apiClient.post<ApiResponse<{ truck: Truck }>>(API_ENDPOINTS.trucks.create, data);
    return {
      success: true,
      data: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
    };
  },

  async get(id: string): Promise<ApiResponse<Truck>> {
    const response = await apiClient.get<ApiResponse<{ truck: Truck }>>(API_ENDPOINTS.trucks.get(id));
    return {
      success: true,
      data: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
    };
  },

  async update(id: string, data: UpdateTruckRequest): Promise<ApiResponse<Truck>> {
    const response = await apiClient.put<ApiResponse<{ truck: Truck }>>(API_ENDPOINTS.trucks.update(id), data);
    return {
      success: true,
      data: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
    };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.trucks.delete(id));
  },

  async assignDriver(id: string, data: AssignDriverToTruckRequest): Promise<ApiResponse<Truck>> {
    const response = await apiClient.post<ApiResponse<{ truck: Truck }>>(API_ENDPOINTS.trucks.assignDriver(id), data);
    return {
      success: true,
      data: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
    };
  },

  async unassignDriver(id: string): Promise<ApiResponse<Truck>> {
    const response = await apiClient.post<ApiResponse<{ truck: Truck }>>(API_ENDPOINTS.trucks.unassignDriver(id));
    return {
      success: true,
      data: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
    };
  },

  async recordMaintenance(id: string, data: RecordMaintenanceRequest): Promise<ApiResponse<Truck>> {
    const response = await apiClient.post<ApiResponse<{ truck: Truck }>>(API_ENDPOINTS.trucks.maintenance(id), data);
    return {
      success: true,
      data: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
    };
  },

  async updateInsurance(id: string, data: UpdateInsuranceRequest): Promise<ApiResponse<Truck>> {
    const response = await apiClient.patch<ApiResponse<{ truck: Truck }>>(API_ENDPOINTS.trucks.insurance(id), data);
    return {
      success: true,
      data: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
    };
  },

  async updateRegistration(
    id: string,
    data: UpdateRegistrationRequest
  ): Promise<ApiResponse<Truck>> {
    const response = await apiClient.patch<ApiResponse<{ truck: Truck }>>(API_ENDPOINTS.trucks.registration(id), data);
    return { success: true, data: response.data?.truck || (response.data as unknown as Truck) };
  },

  async getMyTrucks(): Promise<ApiResponse<Truck[]>> {
    const response = await apiClient.get<ApiResponse<{ trucks: Truck[] }>>(API_ENDPOINTS.trucks.myTrucks);
    return { success: true, data: normalizeTrucks(response.data?.trucks || []) };
  },
};

export default trucksApi;
