/**
 * Applications (Bids) API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  CreateApplicationRequest,
  GetApplicationsParams,
  UpdateApplicationRequest,
  RejectApplicationRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';
import type { Application } from '@/types/entities';

export const applicationsApi = {
  async list(params?: GetApplicationsParams): Promise<PaginatedResponse<Application>> {
    return apiClient.get<PaginatedResponse<Application>>(
      API_ENDPOINTS.applications.list,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async create(data: CreateApplicationRequest): Promise<ApiResponse<Application>> {
    return apiClient.post<ApiResponse<Application>>(API_ENDPOINTS.applications.create, data);
  },

  async get(id: string): Promise<ApiResponse<Application>> {
    return apiClient.get<ApiResponse<Application>>(API_ENDPOINTS.applications.get(id));
  },

  async update(id: string, data: UpdateApplicationRequest): Promise<ApiResponse<Application>> {
    return apiClient.put<ApiResponse<Application>>(API_ENDPOINTS.applications.update(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.applications.delete(id));
  },

  async accept(id: string): Promise<ApiResponse<Application>> {
    return apiClient.post<ApiResponse<Application>>(API_ENDPOINTS.applications.accept(id));
  },

  async reject(id: string, data: RejectApplicationRequest): Promise<ApiResponse<Application>> {
    return apiClient.post<ApiResponse<Application>>(API_ENDPOINTS.applications.reject(id), data);
  },

  async cancel(id: string): Promise<ApiResponse<Application>> {
    return apiClient.post<ApiResponse<Application>>(API_ENDPOINTS.applications.cancel(id));
  },

  async getMyApplications(params?: GetApplicationsParams): Promise<PaginatedResponse<Application>> {
    return apiClient.get<PaginatedResponse<Application>>(
      API_ENDPOINTS.applications.myApplications,
      params as Record<string, string | number | boolean | undefined>
    );
  },
};

export default applicationsApi;
