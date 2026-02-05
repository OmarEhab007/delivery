/**
 * Admin API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { GetUsersParams, GetShipmentsParams, GetPendingApprovalsParams } from '@/types/api';
import type { Shipment, Application, Truck, User } from '@/types/entities';
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
    return apiClient.get<AdminShipmentsResponse>(
      API_ENDPOINTS.admin.shipments,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async approveShipment(id: string): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    return apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.approveShipment(id)
    );
  },

  async rejectShipment(
    id: string,
    reason?: string
  ): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    return apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.rejectShipment(id),
      reason ? { reason } : {}
    );
  },

  async updateShipmentStatus(
    id: string,
    data: { status: string }
  ): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    return apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.updateShipmentStatus(id),
      data
    );
  },

  async assignShipment(
    id: string,
    data: { driverId: string }
  ): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    return apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.assignShipment(id),
      data
    );
  },

  async assignBroker(
    id: string,
    data: { brokerId: string }
  ): Promise<ApiSuccessResponse<{ shipment: Shipment }>> {
    return apiClient.patch<ApiSuccessResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.admin.assignBroker(id),
      data
    );
  },

  async getApplications(params?: Record<string, unknown>): Promise<AdminApplicationsResponse> {
    return apiClient.get<AdminApplicationsResponse>(
      API_ENDPOINTS.admin.applications,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async updateApplicationStatus(
    id: string,
    data: { status: string; adminNotes?: string }
  ): Promise<ApiSuccessResponse<{ application: Application }>> {
    return apiClient.patch<ApiSuccessResponse<{ application: Application }>>(
      API_ENDPOINTS.admin.updateApplicationStatus(id),
      data
    );
  },

  async getTrucks(params?: Record<string, unknown>): Promise<AdminTrucksResponse> {
    return apiClient.get<AdminTrucksResponse>(
      API_ENDPOINTS.admin.trucks,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async updateTruckStatus(
    id: string,
    data: { status: string }
  ): Promise<ApiSuccessResponse<{ truck: Truck }>> {
    return apiClient.patch<ApiSuccessResponse<{ truck: Truck }>>(
      API_ENDPOINTS.admin.updateTruckStatus(id),
      data
    );
  },
};

export default adminApi;
