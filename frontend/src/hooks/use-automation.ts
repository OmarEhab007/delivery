'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi, ApiClientError } from '@/lib/api';
import type {
  CreateAutomationRuleRequest,
  UpdateAutomationRuleRequest,
} from '@/lib/api/automation';
import { toast } from 'sonner';

const STALE_TIME = 60 * 1000; // 1 minute

export const automationKeys = {
  all: ['automation'] as const,
  rules: () => [...automationKeys.all, 'rules'] as const,
};

export function useAutomationRules() {
  return useQuery({
    queryKey: automationKeys.rules(),
    queryFn: () => automationApi.getAutomationRules(),
    staleTime: STALE_TIME,
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAutomationRuleRequest) => automationApi.createAutomationRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.rules() });
      toast.success('تم إنشاء القاعدة بنجاح');
    },
    onError: (error: Error) => {
      let description = error.message;
      if (error instanceof ApiClientError && error.errors?.length) {
        const messages = error.errors
          .map((err) => err.message || (err as { msg?: string }).msg || err.field)
          .filter(Boolean);
        if (messages.length > 0) {
          description = messages.join(' • ');
        }
      }
      toast.error('فشل في إنشاء القاعدة', { description });
    },
  });
}

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAutomationRuleRequest }) =>
      automationApi.updateAutomationRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.rules() });
      toast.success('تم تحديث القاعدة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث القاعدة', { description: error.message });
    },
  });
}
