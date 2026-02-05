/**
 * Truck Owner API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/types/api';
import type { Shipment, Truck, User } from '@/types/entities';
import { normalizeShipment, normalizeShipments, normalizeTrucks } from './normalize';

export interface TruckOwnerShipmentsResponse {
  shipments: Shipment[];
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
}

export const truckOwnerApi = {
  async getShipments(params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<TruckOwnerShipmentsResponse>> {
    const response = await apiClient.get<ApiResponse<TruckOwnerShipmentsResponse>>(
      API_ENDPOINTS.truckOwner.shipments,
      params
    );
    return {
      success: true,
      data: {
        ...response.data,
        shipments: normalizeShipments(response.data?.shipments || []),
      },
    };
  },

  async getAvailableShipments(
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<TruckOwnerShipmentsResponse>> {
    const response = await apiClient.get<ApiResponse<TruckOwnerShipmentsResponse>>(
      API_ENDPOINTS.truckOwner.shipmentsAvailable,
      params
    );
    return {
      success: true,
      data: {
        ...response.data,
        shipments: normalizeShipments(response.data?.shipments || []),
      },
    };
  },

  async assignShipment(shipmentId: string, driverId: string): Promise<ApiResponse<{ shipment: Shipment }>> {
    const response = await apiClient.patch<ApiResponse<{ shipment: Shipment }>>(
      API_ENDPOINTS.truckOwner.assignShipment(shipmentId),
      { driverId }
    );
    return {
      success: true,
      data: {
        shipment: normalizeShipment(
          response.data?.shipment || (response.data as unknown as Shipment)
        ),
      },
    };
  },

  async getDrivers(params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<{ drivers: User[]; count: number }>> {
    return apiClient.get<ApiResponse<{ drivers: User[]; count: number }>>(
      API_ENDPOINTS.truckOwner.drivers,
      params
    );
  },

  async getAvailableDrivers(): Promise<ApiResponse<{ drivers: User[]; count: number }>> {
    return apiClient.get<ApiResponse<{ drivers: User[]; count: number }>>(
      API_ENDPOINTS.truckOwner.driversAvailable
    );
  },

  async getAvailableTrucks(): Promise<ApiResponse<{ trucks: Truck[]; count: number }>> {
    const response = await apiClient.get<ApiResponse<{ trucks: Truck[]; count: number }>>(
      API_ENDPOINTS.truckOwner.trucksAvailable
    );
    return {
      success: true,
      data: {
        trucks: normalizeTrucks(response.data?.trucks || []),
        count: response.data?.count || 0,
      },
    };
  },

  async updateDriver(id: string, data: Partial<User>): Promise<ApiResponse<{ driver: User }>> {
    return apiClient.patch<ApiResponse<{ driver: User }>>(
      API_ENDPOINTS.truckOwner.updateDriver(id),
      data
    );
  },
};

export default truckOwnerApi;
