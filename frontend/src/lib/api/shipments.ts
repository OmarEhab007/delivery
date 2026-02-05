/**
 * Shipments API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  CreateShipmentRequest,
  GetShipmentsParams,
  UpdateShipmentStatusRequest,
  ApproveShipmentRequest,
  AssignShipmentRequest,
  StartDeliveryRequest,
  CompleteDeliveryRequest,
  ReportIssueRequest,
  UpdateComplianceRequest,
  UpdateTrackingRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';
import type { Shipment, TrackingPoint, TimelineEntry, Application } from '@/types/entities';
import { normalizeApplications, normalizeShipment, normalizeShipments } from './normalize';

export const shipmentsApi = {
  async list(params?: GetShipmentsParams): Promise<PaginatedResponse<Shipment>> {
    const response = await apiClient.get<ApiResponse<{ shipments: Shipment[]; pagination?: { total: number; page: number; pages: number; limit: number } }>>(
      API_ENDPOINTS.shipments.list,
      params as Record<string, string | number | boolean | undefined>
    );
    const shipments = normalizeShipments(response.data?.shipments || []);
    const pagination = response.data?.pagination || {
      total: shipments.length,
      page: 1,
      pages: 1,
      limit: shipments.length,
    };
    return {
      success: true,
      data: shipments,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.pages,
      },
    };
  },

  async create(data: CreateShipmentRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.create, data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async get(id: string): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.get<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.get(id));
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async update(id: string, data: Partial<CreateShipmentRequest>): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.put<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.update(id), data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.shipments.delete(id));
  },

  async updateStatus(id: string, data: UpdateShipmentStatusRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.patch<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.updateStatus(id), data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async approve(id: string, data: ApproveShipmentRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.approve(id), data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async assign(id: string, data: AssignShipmentRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.assign(id), data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async startDelivery(id: string, data: StartDeliveryRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.startDelivery(id), data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async completeDelivery(id: string, data: CompleteDeliveryRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.completeDelivery(id), data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async updateTracking(id: string, data: UpdateTrackingRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.patch<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.updateTracking(id), data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async getTrackingHistory(id: string): Promise<ApiResponse<TrackingPoint[]>> {
    const response = await apiClient.get<ApiResponse<{ trackingHistory: TrackingPoint[] }>>(
      API_ENDPOINTS.shipments.trackingHistory(id)
    );
    return {
      success: true,
      data: response.data?.trackingHistory || [],
    };
  },

  async getTimeline(id: string): Promise<ApiResponse<TimelineEntry[]>> {
    const response = await shipmentsApi.get(id);
    return {
      success: true,
      data: response.data?.timeline || [],
    };
  },

  async reportIssue(id: string, data: ReportIssueRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.post<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.reportIssue(id), data);
    return {
      success: true,
      data: normalizeShipment(
        response.data?.shipment || (response.data as unknown as Shipment)
      ),
    };
  },

  async updateCompliance(id: string, data: UpdateComplianceRequest): Promise<ApiResponse<Shipment>> {
    const response = await apiClient.patch<ApiResponse<{ shipment: Shipment }>>(API_ENDPOINTS.shipments.compliance(id), data);
    return {
      success: true,
      data: response.data?.shipment || (response.data as unknown as Shipment),
    };
  },

  async getApplications(id: string): Promise<ApiResponse<Application[]>> {
    const response = await apiClient.get<ApiResponse<{ applications: Application[] }>>(
      API_ENDPOINTS.shipments.applications(id)
    );
    return {
      success: true,
      data: normalizeApplications(response.data?.applications || []),
    };
  },
};

export default shipmentsApi;
