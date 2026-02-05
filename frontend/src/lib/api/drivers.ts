/**
 * Driver (current user) API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  ApiResponse,
  DriverCheckInRequest,
  DriverCheckOutRequest,
  DriverStartDeliveryRequest,
  DriverCompleteDeliveryRequest,
  DriverIssueRequest,
  UpdateDriverStatusRequest,
  UpdateDriverLocationRequest,
} from '@/types/api';
import type { Shipment, Truck, User } from '@/types/entities';
import { normalizeShipment, normalizeShipments, normalizeTruck } from './normalize';

export interface DriverDashboardData {
  driver: User;
  truck: Truck | null;
  activeShipments: Shipment[];
  nextDelivery: Shipment | null;
  metrics: {
    totalDeliveriesCompleted: number;
    todayDeliveriesCompleted: number;
    activeShipmentCount: number;
    openIssuesCount: number;
  };
  openIssues: Array<{ _id: string; origin: Shipment['origin']; destination: Shipment['destination']; issues: Shipment['issues'] }>;
}

export const driversApi = {
  async getDashboard(): Promise<ApiResponse<DriverDashboardData>> {
    const response = await apiClient.get<ApiResponse<DriverDashboardData>>(
      API_ENDPOINTS.driver.dashboard
    );
    return {
      success: true,
      data: {
        driver: response.data?.driver || (response.data as unknown as User),
        truck: response.data?.truck ? normalizeTruck(response.data.truck) : null,
        activeShipments: normalizeShipments(response.data?.activeShipments || []),
        nextDelivery: response.data?.nextDelivery
          ? normalizeShipment(response.data.nextDelivery)
          : null,
        metrics: response.data?.metrics || {
          totalDeliveriesCompleted: 0,
          todayDeliveriesCompleted: 0,
          activeShipmentCount: 0,
          openIssuesCount: 0,
        },
        openIssues: response.data?.openIssues || [],
      },
    };
  },

  async getAssignedShipments(): Promise<ApiResponse<{ shipments: Shipment[]; count: number }>> {
    const response = await apiClient.get<ApiResponse<{ shipments: Shipment[]; count: number }>>(
      API_ENDPOINTS.driver.shipmentsAssigned
    );
    return {
      success: true,
      data: {
        shipments: normalizeShipments(response.data?.shipments || []),
        count: response.data?.count || 0,
      },
    };
  },

  async getShipmentHistory(): Promise<ApiResponse<{ shipments: Shipment[]; count: number }>> {
    const response = await apiClient.get<ApiResponse<{ shipments: Shipment[]; count: number }>>(
      API_ENDPOINTS.driver.shipmentsHistory
    );
    return {
      success: true,
      data: {
        shipments: normalizeShipments(response.data?.shipments || []),
        count: response.data?.count || 0,
      },
    };
  },

  async startDelivery(id: string, data: DriverStartDeliveryRequest): Promise<ApiResponse<{ shipment: Shipment }>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.driver.startDelivery(id),
      data
    );
    return {
      success: true,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async completeDelivery(
    id: string,
    data: DriverCompleteDeliveryRequest
  ): Promise<ApiResponse<{ shipment: Shipment }>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.driver.completeDelivery(id),
      data
    );
    return {
      success: true,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async reportIssue(id: string, data: DriverIssueRequest): Promise<ApiResponse<{ shipment: Shipment }>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.driver.reportIssue(id),
      data
    );
    return {
      success: true,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async updateShipmentStatus(
    id: string,
    data: { status: Shipment['status']; notes?: string }
  ): Promise<ApiResponse<{ shipment: Shipment }>> {
    const response = await apiClient.patch<ApiResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.driver.updateShipmentStatus(id),
      data
    );
    return {
      success: true,
      data: {
        shipment: normalizeShipment(response.data?.shipment || (response.data as unknown as Shipment)),
      },
    };
  },

  async uploadProof(id: string, formData: FormData): Promise<ApiResponse<{ url?: string }>> {
    return apiClient.upload<ApiResponse<{ url?: string }>>(API_ENDPOINTS.driver.uploadProof(id), formData);
  },

  async updateStatus(data: UpdateDriverStatusRequest): Promise<ApiResponse<{ driver: User }>> {
    return apiClient.patch<ApiResponse<{ driver: User }>>(API_ENDPOINTS.driver.status, data);
  },

  async updateAvailability(isAvailable: boolean): Promise<ApiResponse<{ driver: User }>> {
    return apiClient.patch<ApiResponse<{ driver: User }>>(API_ENDPOINTS.driver.availability, { isAvailable });
  },

  async checkIn(data: DriverCheckInRequest): Promise<ApiResponse<{ driver: User; truck: Truck }>> {
    const response = await apiClient.post<ApiResponse<{ driver: User; truck: Truck }>>(
      API_ENDPOINTS.driver.checkin,
      data
    );
    return {
      success: true,
      data: {
        driver: response.data?.driver || (response.data as unknown as User),
        truck: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
      },
    };
  },

  async checkOut(data: DriverCheckOutRequest): Promise<ApiResponse<{ driver: User; truck: Truck }>> {
    const response = await apiClient.post<ApiResponse<{ driver: User; truck: Truck }>>(
      API_ENDPOINTS.driver.checkout,
      data
    );
    return {
      success: true,
      data: {
        driver: response.data?.driver || (response.data as unknown as User),
        truck: normalizeTruck(response.data?.truck || (response.data as unknown as Truck)),
      },
    };
  },

  async updateLocation(data: UpdateDriverLocationRequest): Promise<ApiResponse<{ location: { coordinates: number[] } }>> {
    return apiClient.patch<ApiResponse<{ location: { coordinates: number[] } }>>(API_ENDPOINTS.driver.location, data);
  },

  async getRoute(shipmentId: string): Promise<ApiResponse<{ route: Array<{ lat: number; lng: number }> }>> {
    return apiClient.get<ApiResponse<{ route: Array<{ lat: number; lng: number }> }>>(
      API_ENDPOINTS.driver.route(shipmentId)
    );
  },
};

export default driversApi;
