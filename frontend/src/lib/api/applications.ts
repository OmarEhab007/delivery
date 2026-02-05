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
import { normalizeApplication, normalizeApplications } from './normalize';

export const applicationsApi = {
  async list(params?: GetApplicationsParams): Promise<PaginatedResponse<Application>> {
    const response = await apiClient.get<ApiResponse<{ applications: Application[] }>>(
      API_ENDPOINTS.applications.list,
      params as Record<string, string | number | boolean | undefined>
    );
    const applications = normalizeApplications(response.data?.applications || []);
    return {
      success: true,
      data: applications,
      pagination: {
        page: 1,
        limit: applications.length,
        total: applications.length,
        totalPages: 1,
      },
    };
  },

  async create(data: CreateApplicationRequest): Promise<ApiResponse<Application>> {
    const response = await apiClient.post<ApiResponse<{ application: Application }>>(API_ENDPOINTS.applications.create, data);
    return {
      success: true,
      data: normalizeApplication(
        (response.data as { application?: Application }).application ||
          (response.data as unknown as Application)
      ),
    };
  },

  async get(id: string): Promise<ApiResponse<Application>> {
    const response = await apiClient.get<ApiResponse<{ application: Application }>>(API_ENDPOINTS.applications.get(id));
    return {
      success: true,
      data: normalizeApplication(
        response.data?.application || (response.data as unknown as Application)
      ),
    };
  },

  async update(id: string, data: UpdateApplicationRequest): Promise<ApiResponse<Application>> {
    const response = await apiClient.put<ApiResponse<{ application: Application }>>(API_ENDPOINTS.applications.update(id), data);
    return {
      success: true,
      data: normalizeApplication(
        response.data?.application || (response.data as unknown as Application)
      ),
    };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.applications.delete(id));
  },

  async accept(id: string): Promise<ApiResponse<Application>> {
    const response = await apiClient.patch<ApiResponse<{ application: Application }>>(API_ENDPOINTS.applications.accept(id));
    return {
      success: true,
      data: normalizeApplication(
        response.data?.application || (response.data as unknown as Application)
      ),
    };
  },

  async reject(id: string, data: RejectApplicationRequest): Promise<ApiResponse<Application>> {
    const response = await apiClient.patch<ApiResponse<{ application: Application }>>(API_ENDPOINTS.applications.reject(id), data);
    return {
      success: true,
      data: normalizeApplication(
        response.data?.application || (response.data as unknown as Application)
      ),
    };
  },

  async cancel(id: string): Promise<ApiResponse<Application>> {
    const response = await apiClient.patch<ApiResponse<{ application: Application }>>(API_ENDPOINTS.applications.cancel(id));
    return {
      success: true,
      data: normalizeApplication(
        response.data?.application || (response.data as unknown as Application)
      ),
    };
  },

  async getMyApplications(params?: GetApplicationsParams): Promise<PaginatedResponse<Application>> {
    const response = await apiClient.get<ApiResponse<{ applications: Application[] }>>(
      API_ENDPOINTS.applications.myApplications,
      params as Record<string, string | number | boolean | undefined>
    );
    const applications = normalizeApplications(response.data?.applications || []);
    return {
      success: true,
      data: applications,
      pagination: {
        page: 1,
        limit: applications.length,
        total: applications.length,
        totalPages: 1,
      },
    };
  },
};

export default applicationsApi;
