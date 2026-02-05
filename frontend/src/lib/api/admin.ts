/**
 * Admin API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { GetUsersParams, GetShipmentsParams, GetPendingApprovalsParams } from '@/types/api';
import type { Shipment, Application, Truck, User } from '@/types/entities';
import { normalizeApplication, normalizeApplications, normalizeShipment, normalizeShipments, normalizeTruck, normalizeTrucks } from './normalize';
import type {
  AdminDashboardResponse,
  AdminUsersResponse,
  RegistrationRequestsResponse,
  AdminShipmentsResponse,
  AdminApplicationsResponse,
  AdminTrucksResponse,
  ApiSuccessResponse,
} from '@/types/admin';

export const adminApi = {
  async getDashboard(): Promise<AdminDashboardResponse> {
    return apiClient.get<AdminDashboardResponse>(API_ENDPOINTS.admin.dashboard);
  },

  async getUsers(params?: GetUsersParams): Promise<AdminUsersResponse> {
    return apiClient.get<AdminUsersResponse>(
      API_ENDPOINTS.admin.users,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getUser(id: string): Promise<ApiSuccessResponse<User>> {
    return apiClient.get<ApiSuccessResponse<User>>(API_ENDPOINTS.admin.user(id));
  },

  async updateUser(id: string, data: Partial<User>): Promise<ApiSuccessResponse<{ user: User }>> {
    return apiClient.put<ApiSuccessResponse<{ user: User }>>(API_ENDPOINTS.admin.user(id), data);
  },

  async deleteUser(id: string): Promise<ApiSuccessResponse<{ message: string }>> {
    return apiClient.delete<ApiSuccessResponse<{ message: string }>>(API_ENDPOINTS.admin.user(id));
  },

  async getRegistrationRequests(
    params?: GetPendingApprovalsParams
  ): Promise<RegistrationRequestsResponse> {
    return apiClient.get<RegistrationRequestsResponse>(
      API_ENDPOINTS.admin.registrationRequests,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async approveRegistrationRequest(id: string): Promise<ApiSuccessResponse<{ message: string }>> {
    return apiClient.patch<ApiSuccessResponse<{ message: string }>>(
      API_ENDPOINTS.admin.approveRegistration(id)
    );
  },

  async rejectRegistrationRequest(
    id: string,
    reason?: string
  ): Promise<ApiSuccessResponse<{ message: string }>> {
    return apiClient.patch<ApiSuccessResponse<{ message: string }>>(
      API_ENDPOINTS.admin.rejectRegistration(id),
      reason ? { reason } : {}
    );
  },

  async getShipments(params?: GetShipmentsParams): Promise<AdminShipmentsResponse> {
    const response = await apiClient.get<AdminShipmentsResponse>(
      API_ENDPOINTS.admin.shipments,
      params as Record<string, string | number | boolean | undefined>
    );
    return {
      status: response.status,
      data: {
        ...response.data,
        shipments: normalizeShipments(response.data?.shipments || []),
      },
    };
  },

  async getShipment(id: string): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    const response = await apiClient.get<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.shipment(id)
    );
    return {
      status: response.status,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async createUser(data: Partial<User> & { password: string }): Promise<ApiSuccessResponse<{ user: User }>> {
    return apiClient.post<ApiSuccessResponse<{ user: User }>>(API_ENDPOINTS.admin.users, data);
  },

  async approveShipment(id: string): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    const response = await apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.approveShipment(id)
    );
    return {
      status: response.status,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async rejectShipment(
    id: string,
    reason?: string
  ): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    const response = await apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.rejectShipment(id),
      reason ? { reason } : {}
    );
    return {
      status: response.status,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async updateShipmentStatus(
    id: string,
    data: { status: string }
  ): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    const response = await apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.updateShipmentStatus(id),
      data
    );
    return {
      status: response.status,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async assignShipment(
    id: string,
    data: { driverId: string; assignedTruckId?: string }
  ): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    const response = await apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.assignShipment(id),
      data
    );
    return {
      status: response.status,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async assignBroker(
    id: string,
    data: { brokerId: string }
  ): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    const response = await apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.assignBroker(id),
      data
    );
    return {
      status: response.status,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async getApplications(params?: Record<string, unknown>): Promise<AdminApplicationsResponse> {
    const response = await apiClient.get<AdminApplicationsResponse>(
      API_ENDPOINTS.admin.applications,
      params as Record<string, string | number | boolean | undefined>
    );
    return {
      status: response.status,
      data: {
        ...response.data,
        applications: normalizeApplications(response.data?.applications || []),
      },
    };
  },

  async updateApplicationStatus(
    id: string,
    data: { status: string; adminNotes?: string }
  ): Promise<ApiSuccessResponse<{ application: Application }>> {
    const response = await apiClient.patch<ApiSuccessResponse<{ application: Application }>>(
      API_ENDPOINTS.admin.updateApplicationStatus(id),
      data
    );
    return {
      status: response.status,
      data: {
        application: normalizeApplication(
          response.data?.application || (response.data as unknown as Application)
        ),
      },
    };
  },

  async getTrucks(params?: Record<string, unknown>): Promise<AdminTrucksResponse> {
    const response = await apiClient.get<AdminTrucksResponse>(
      API_ENDPOINTS.admin.trucks,
      params as Record<string, string | number | boolean | undefined>
    );
    return {
      status: response.status,
      data: {
        ...response.data,
        trucks: normalizeTrucks(response.data?.trucks || []),
      },
    };
  },

  async updateTruckStatus(
    id: string,
    data: { status: string }
  ): Promise<ApiSuccessResponse<{ truck: Truck }>> {
    const response = await apiClient.patch<ApiSuccessResponse<{ truck: Truck }>>(
      API_ENDPOINTS.admin.updateTruckStatus(id),
      data
    );
    return {
      status: response.status,
      data: {
        truck: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
      },
    };
  },
};

export default adminApi;
