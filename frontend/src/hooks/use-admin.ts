'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { GetUsersParams, GetShipmentsParams, GetPendingApprovalsParams } from '@/types/api';
import type { User } from '@/types/entities';
import { toast } from 'sonner';

const STALE_TIME_LIST = 60 * 1000; // 1 minute for lists
const STALE_TIME_DASHBOARD = 5 * 60 * 1000; // 5 minutes for dashboard

export const adminKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  users: (params?: GetUsersParams) => ['admin', 'users', params] as const,
  user: (id: string) => ['admin', 'user', id] as const,
  registrations: (params?: GetPendingApprovalsParams) =>
    ['admin', 'registrations', params] as const,
  shipments: (params?: GetShipmentsParams) => ['admin', 'shipments', params] as const,
  shipment: (id: string) => ['admin', 'shipment', id] as const,
  applications: (params?: Record<string, unknown>) => ['admin', 'applications', params] as const,
  trucks: (params?: Record<string, unknown>) => ['admin', 'trucks', params] as const,
  documents: (params?: Record<string, unknown>) => ['admin', 'documents', params] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: () => adminApi.getDashboard(),
    staleTime: STALE_TIME_DASHBOARD,
  });
}

export function useAdminUsers(params?: GetUsersParams) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.getUsers(params),
    staleTime: STALE_TIME_LIST,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminApi.getUser(id),
    enabled: !!id,
    staleTime: 0, // Always fresh for detail views
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('تم تحديث المستخدم بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل تحديث المستخدم', { description: error.message });
    },
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('تم حذف المستخدم');
    },
    onError: (error: Error) => {
      toast.error('فشل حذف المستخدم', { description: error.message });
    },
  });
}

export function useAdminRegistrationRequests(params?: GetPendingApprovalsParams) {
  return useQuery({
    queryKey: adminKeys.registrations(params),
    queryFn: () => adminApi.getRegistrationRequests(params),
    staleTime: STALE_TIME_LIST,
  });
}

export function useAdminApproveRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.approveRegistrationRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.registrations() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('تمت الموافقة على الطلب');
    },
    onError: (error: Error) => {
      toast.error('فشل الموافقة', { description: error.message });
    },
  });
}

export function useAdminRejectRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.rejectRegistrationRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.registrations() });
      toast.success('تم رفض الطلب');
    },
    onError: (error: Error) => {
      toast.error('فشل الرفض', { description: error.message });
    },
  });
}

// Aliases for backward compatibility
export const useRegistrationRequests = useAdminRegistrationRequests;
export const useApproveRegistration = useAdminApproveRegistration;
export const useRejectRegistration = useAdminRejectRegistration;

export function useAdminShipments(params?: GetShipmentsParams) {
  return useQuery({
    queryKey: adminKeys.shipments(params),
    queryFn: () => adminApi.getShipments(params),
    staleTime: STALE_TIME_LIST,
  });
}

export function useAdminShipment(id: string) {
  return useQuery({
    queryKey: adminKeys.shipment(id),
    queryFn: () => adminApi.getShipment(id),
    enabled: !!id,
    staleTime: 0, // Always fresh for detail views
  });
}

export function useAdminApproveShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.approveShipment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.shipment(id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.shipments() });
      toast.success('تم اعتماد الشحنة');
    },
    onError: (error: Error) => {
      toast.error('فشل اعتماد الشحنة', { description: error.message });
    },
  });
}

export function useAdminRejectShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.rejectShipment(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.shipment(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.shipments() });
      toast.success('تم رفض الشحنة');
    },
    onError: (error: Error) => {
      toast.error('فشل رفض الشحنة', { description: error.message });
    },
  });
}

export function useAdminAssignShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, driverId, assignedTruckId }: { id: string; driverId: string; assignedTruckId?: string }) =>
      adminApi.assignShipment(id, { driverId, assignedTruckId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.shipment(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.shipments() });
      toast.success('تم تعيين الشحنة للسائق');
    },
    onError: (error: Error) => {
      toast.error('فشل تعيين الشحنة', { description: error.message });
    },
  });
}

export function useAdminUpdateShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateShipmentStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.shipment(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.shipments() });
      toast.success('تم تحديث حالة الشحنة');
    },
    onError: (error: Error) => {
      toast.error('فشل تحديث حالة الشحنة', { description: error.message });
    },
  });
}

export function useAdminApplications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: adminKeys.applications(params),
    queryFn: () => adminApi.getApplications(params),
    staleTime: STALE_TIME_LIST,
  });
}

export function useAdminUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) =>
      adminApi.updateApplicationStatus(id, { status, adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.applications() });
      toast.success('تم تحديث حالة الطلب');
    },
    onError: (error: Error) => {
      toast.error('فشل تحديث حالة الطلب', { description: error.message });
    },
  });
}

export function useAdminTrucks(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: adminKeys.trucks(params),
    queryFn: () => adminApi.getTrucks(params),
    staleTime: STALE_TIME_LIST,
  });
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; phone: string; role: string; [key: string]: unknown }) =>
      adminApi.createUser(data as Partial<User> & { password: string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('تم إنشاء المستخدم بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل إنشاء المستخدم', { description: error.message });
    },
  });
}

export function useAdminUpdateTruckStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateTruckStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.trucks() });
      toast.success('تم تحديث حالة الشاحنة');
    },
    onError: (error: Error) => {
      toast.error('فشل تحديث حالة الشاحنة', { description: error.message });
    },
  });
}
