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

export const shipmentsApi = {
  async list(params?: GetShipmentsParams): Promise<PaginatedResponse<Shipment>> {
    return apiClient.get<PaginatedResponse<Shipment>>(API_ENDPOINTS.shipments.list, params as Record<string, string | number | boolean | undefined>);
  },

  async create(data: CreateShipmentRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.post<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.create, data);
  },

  async get(id: string): Promise<ApiResponse<Shipment>> {
    return apiClient.get<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.get(id));
  },

  async update(id: string, data: Partial<CreateShipmentRequest>): Promise<ApiResponse<Shipment>> {
    return apiClient.put<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.update(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.shipments.delete(id));
  },

  async updateStatus(id: string, data: UpdateShipmentStatusRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.patch<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.updateStatus(id), data);
  },

  async approve(id: string, data: ApproveShipmentRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.post<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.approve(id), data);
  },

  async assign(id: string, data: AssignShipmentRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.post<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.assign(id), data);
  },

  async startDelivery(id: string, data: StartDeliveryRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.post<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.startDelivery(id), data);
  },

  async completeDelivery(id: string, data: CompleteDeliveryRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.post<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.completeDelivery(id), data);
  },

  async updateTracking(id: string, data: UpdateTrackingRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.patch<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.updateTracking(id), data);
  },

  async getTrackingHistory(id: string): Promise<ApiResponse<TrackingPoint[]>> {
    return apiClient.get<ApiResponse<TrackingPoint[]>>(API_ENDPOINTS.shipments.trackingHistory(id));
  },

  async getTimeline(id: string): Promise<ApiResponse<TimelineEntry[]>> {
    return apiClient.get<ApiResponse<TimelineEntry[]>>(API_ENDPOINTS.shipments.timeline(id));
  },

  async reportIssue(id: string, data: ReportIssueRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.post<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.reportIssue(id), data);
  },

  async updateCompliance(id: string, data: UpdateComplianceRequest): Promise<ApiResponse<Shipment>> {
    return apiClient.patch<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.compliance(id), data);
  },

  async getApplications(id: string): Promise<ApiResponse<Application[]>> {
    return apiClient.get<ApiResponse<Application[]>>(API_ENDPOINTS.shipments.applications(id));
  },
};

export default shipmentsApi;
