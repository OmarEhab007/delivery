'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brokersApi } from '@/lib/api/brokers';
import type { BrokerFormData } from '@/lib/validations';
import { toast } from 'sonner';

const STALE_TIME = 60 * 1000; // 1 minute

export const brokerKeys = {
  all: ['brokers'] as const,
  lists: () => [...brokerKeys.all, 'list'] as const,
  list: () => [...brokerKeys.lists()] as const,
  details: () => [...brokerKeys.all, 'detail'] as const,
  detail: (id: string) => [...brokerKeys.details(), id] as const,
};

export function useBrokers() {
  return useQuery({
    queryKey: brokerKeys.list(),
    queryFn: () => brokersApi.getBrokers(),
    staleTime: STALE_TIME,
  });
}

export function useBroker(id: string) {
  return useQuery({
    queryKey: brokerKeys.detail(id),
    queryFn: () => brokersApi.getBroker(id),
    enabled: !!id,
    staleTime: 0, // Always fresh for detail views
  });
}

export function useCreateBroker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BrokerFormData) => brokersApi.createBroker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.lists() });
      toast.success('تم إضافة الوسيط بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في إضافة الوسيط', { description: error.message });
    },
  });
}

export function useUpdateBroker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BrokerFormData> }) =>
      brokersApi.updateBroker(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: brokerKeys.lists() });
      toast.success('تم تحديث الوسيط بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث الوسيط', { description: error.message });
    },
  });
}

export function useDeactivateBroker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brokersApi.deactivateBroker(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: brokerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: brokerKeys.lists() });
      toast.success('تم إلغاء تفعيل الوسيط');
    },
    onError: (error: Error) => {
      toast.error('فشل في إلغاء تفعيل الوسيط', { description: error.message });
    },
  });
}
