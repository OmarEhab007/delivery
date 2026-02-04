'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsApi } from '@/lib/api';
import type {
  GetShipmentsParams,
  CreateShipmentRequest,
  UpdateShipmentStatusRequest,
  ApproveShipmentRequest,
  AssignShipmentRequest,
  StartDeliveryRequest,
  CompleteDeliveryRequest,
  ReportIssueRequest,
  UpdateComplianceRequest,
  UpdateTrackingRequest,
} from '@/types/api';
import { toast } from 'sonner';

export const shipmentKeys = {
  all: ['shipments'] as const,
  lists: () => [...shipmentKeys.all, 'list'] as const,
  list: (params?: GetShipmentsParams) => [...shipmentKeys.lists(), params] as const,
  details: () => [...shipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...shipmentKeys.details(), id] as const,
  timeline: (id: string) => [...shipmentKeys.detail(id), 'timeline'] as const,
  tracking: (id: string) => [...shipmentKeys.detail(id), 'tracking'] as const,
  applications: (id: string) => [...shipmentKeys.detail(id), 'applications'] as const,
};

export function useShipments(params?: GetShipmentsParams) {
  return useQuery({
    queryKey: shipmentKeys.list(params),
    queryFn: () => shipmentsApi.list(params),
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: shipmentKeys.detail(id),
    queryFn: () => shipmentsApi.get(id),
    enabled: !!id,
  });
}

export function useShipmentTimeline(id: string) {
  return useQuery({
    queryKey: shipmentKeys.timeline(id),
    queryFn: () => shipmentsApi.getTimeline(id),
    enabled: !!id,
  });
}

export function useShipmentTracking(id: string) {
  return useQuery({
    queryKey: shipmentKeys.tracking(id),
    queryFn: () => shipmentsApi.getTrackingHistory(id),
    enabled: !!id,
  });
}

export function useShipmentApplications(id: string) {
  return useQuery({
    queryKey: shipmentKeys.applications(id),
    queryFn: () => shipmentsApi.getApplications(id),
    enabled: !!id,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShipmentRequest) => shipmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم إنشاء الشحنة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في إنشاء الشحنة', { description: error.message });
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateShipmentRequest> }) =>
      shipmentsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم تحديث الشحنة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث الشحنة', { description: error.message });
    },
  });
}

export function useDeleteShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shipmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم حذف الشحنة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في حذف الشحنة', { description: error.message });
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShipmentStatusRequest }) =>
      shipmentsApi.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم تحديث حالة الشحنة');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث الحالة', { description: error.message });
    },
  });
}

export function useApproveShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveShipmentRequest }) =>
      shipmentsApi.approve(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم اعتماد الشحنة');
    },
    onError: (error: Error) => {
      toast.error('فشل في اعتماد الشحنة', { description: error.message });
    },
  });
}

export function useAssignShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignShipmentRequest }) =>
      shipmentsApi.assign(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم تعيين الشحنة للسائق');
    },
    onError: (error: Error) => {
      toast.error('فشل في تعيين الشحنة', { description: error.message });
    },
  });
}

export function useStartDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StartDeliveryRequest }) =>
      shipmentsApi.startDelivery(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم بدء التوصيل');
    },
    onError: (error: Error) => {
      toast.error('فشل في بدء التوصيل', { description: error.message });
    },
  });
}

export function useCompleteDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteDeliveryRequest }) =>
      shipmentsApi.completeDelivery(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم إتمام التوصيل بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في إتمام التوصيل', { description: error.message });
    },
  });
}

export function useReportIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReportIssueRequest }) =>
      shipmentsApi.reportIssue(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
      toast.success('تم الإبلاغ عن المشكلة');
    },
    onError: (error: Error) => {
      toast.error('فشل في الإبلاغ عن المشكلة', { description: error.message });
    },
  });
}

export function useUpdateCompliance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateComplianceRequest }) =>
      shipmentsApi.updateCompliance(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
      toast.success('تم تحديث بيانات الامتثال');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث بيانات الامتثال', { description: error.message });
    },
  });
}

export function useUpdateTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTrackingRequest }) =>
      shipmentsApi.updateTracking(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.tracking(id) });
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث الموقع', { description: error.message });
    },
  });
}

export default useShipments;
