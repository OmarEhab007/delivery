'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/lib/api';
import type {
  GetApplicationsParams,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  RejectApplicationRequest,
} from '@/types/api';
import { toast } from 'sonner';
import { shipmentKeys } from './use-shipments';

export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (params?: GetApplicationsParams) => [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  my: () => [...applicationKeys.all, 'my'] as const,
  myList: (params?: GetApplicationsParams) => [...applicationKeys.my(), params] as const,
};

export function useApplications(params?: GetApplicationsParams) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationsApi.list(params),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsApi.get(id),
    enabled: !!id,
  });
}

export function useMyApplications(params?: GetApplicationsParams) {
  return useQuery({
    queryKey: applicationKeys.myList(params),
    queryFn: () => applicationsApi.getMyApplications(params),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApplicationRequest) => applicationsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.my() });
      queryClient.invalidateQueries({
        queryKey: shipmentKeys.applications(variables.shipmentId),
      });
      toast.success('تم تقديم العرض بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تقديم العرض', { description: error.message });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationRequest }) =>
      applicationsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.my() });
      toast.success('تم تحديث العرض بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث العرض', { description: error.message });
    },
  });
}

export function useAcceptApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.my() });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('تم قبول العرض بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في قبول العرض', { description: error.message });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectApplicationRequest }) =>
      applicationsApi.reject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.my() });
      toast.success('تم رفض العرض');
    },
    onError: (error: Error) => {
      toast.error('فشل في رفض العرض', { description: error.message });
    },
  });
}

export function useCancelApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.my() });
      toast.success('تم إلغاء العرض');
    },
    onError: (error: Error) => {
      toast.error('فشل في إلغاء العرض', { description: error.message });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.my() });
      toast.success('تم حذف العرض');
    },
    onError: (error: Error) => {
      toast.error('فشل في حذف العرض', { description: error.message });
    },
  });
}

export default useApplications;
