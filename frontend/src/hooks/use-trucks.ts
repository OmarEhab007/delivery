'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trucksApi } from '@/lib/api';
import type {
  GetTrucksParams,
  CreateTruckRequest,
  UpdateTruckRequest,
  AssignDriverToTruckRequest,
  RecordMaintenanceRequest,
  UpdateInsuranceRequest,
  UpdateRegistrationRequest,
} from '@/types/api';
import { toast } from 'sonner';

export const truckKeys = {
  all: ['trucks'] as const,
  lists: () => [...truckKeys.all, 'list'] as const,
  list: (params?: GetTrucksParams) => [...truckKeys.lists(), params] as const,
  details: () => [...truckKeys.all, 'detail'] as const,
  detail: (id: string) => [...truckKeys.details(), id] as const,
  my: () => [...truckKeys.all, 'my'] as const,
};

export function useTrucks(params?: GetTrucksParams) {
  return useQuery({
    queryKey: truckKeys.list(params),
    queryFn: () => trucksApi.list(params),
  });
}

export function useTruck(id: string) {
  return useQuery({
    queryKey: truckKeys.detail(id),
    queryFn: () => trucksApi.get(id),
    enabled: !!id,
  });
}

export function useMyTrucks() {
  return useQuery({
    queryKey: truckKeys.my(),
    queryFn: () => trucksApi.getMyTrucks(),
  });
}

export function useCreateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTruckRequest) => trucksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: truckKeys.lists() });
      queryClient.invalidateQueries({ queryKey: truckKeys.my() });
      toast.success('تم إضافة الشاحنة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في إضافة الشاحنة', { description: error.message });
    },
  });
}

export function useUpdateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTruckRequest }) =>
      trucksApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: truckKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: truckKeys.lists() });
      queryClient.invalidateQueries({ queryKey: truckKeys.my() });
      toast.success('تم تحديث الشاحنة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث الشاحنة', { description: error.message });
    },
  });
}

export function useDeleteTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trucksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: truckKeys.lists() });
      queryClient.invalidateQueries({ queryKey: truckKeys.my() });
      toast.success('تم حذف الشاحنة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في حذف الشاحنة', { description: error.message });
    },
  });
}

export function useAssignDriverToTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignDriverToTruckRequest }) =>
      trucksApi.assignDriver(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: truckKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: truckKeys.lists() });
      queryClient.invalidateQueries({ queryKey: truckKeys.my() });
      toast.success('تم تعيين السائق بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تعيين السائق', { description: error.message });
    },
  });
}

export function useUnassignDriverFromTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trucksApi.unassignDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: truckKeys.lists() });
      queryClient.invalidateQueries({ queryKey: truckKeys.my() });
      toast.success('تم إلغاء تعيين السائق');
    },
    onError: (error: Error) => {
      toast.error('فشل في إلغاء تعيين السائق', { description: error.message });
    },
  });
}

export function useRecordMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordMaintenanceRequest }) =>
      trucksApi.recordMaintenance(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: truckKeys.detail(id) });
      toast.success('تم تسجيل الصيانة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تسجيل الصيانة', { description: error.message });
    },
  });
}

export function useUpdateTruckInsurance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInsuranceRequest }) =>
      trucksApi.updateInsurance(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: truckKeys.detail(id) });
      toast.success('تم تحديث بيانات التأمين');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث بيانات التأمين', { description: error.message });
    },
  });
}

export function useUpdateTruckRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRegistrationRequest }) =>
      trucksApi.updateRegistration(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: truckKeys.detail(id) });
      toast.success('تم تحديث بيانات الترخيص');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث بيانات الترخيص', { description: error.message });
    },
  });
}

export default useTrucks;
