'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationsApi, ApiClientError } from '@/lib/api';
import type { CreateCredentialRequest, CreateWebhookRequest } from '@/lib/api/integrations';
import { toast } from 'sonner';

const STALE_TIME = 60 * 1000; // 1 minute

export const integrationKeys = {
  all: ['integrations'] as const,
  credentials: () => [...integrationKeys.all, 'credentials'] as const,
  webhooks: () => [...integrationKeys.all, 'webhooks'] as const,
};

export function useIntegrationCredentials() {
  return useQuery({
    queryKey: integrationKeys.credentials(),
    queryFn: () => integrationsApi.getCredentials(),
    staleTime: STALE_TIME,
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCredentialRequest) => integrationsApi.createCredential(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.credentials() });
      toast.success('تم إنشاء المفتاح بنجاح');
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
      toast.error('فشل في إنشاء المفتاح', { description });
    },
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: integrationKeys.webhooks(),
    queryFn: () => integrationsApi.getWebhooks(),
    staleTime: STALE_TIME,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWebhookRequest) => integrationsApi.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.webhooks() });
      toast.success('تم إضافة الـ Webhook بنجاح');
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
      toast.error('فشل في إضافة الـ Webhook', { description });
    },
  });
}
