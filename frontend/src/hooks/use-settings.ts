'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, type SettingsData } from '@/lib/api/settings';
import { toast } from 'sonner';

export const settingsKeys = {
  all: ['settings'] as const,
  detail: () => [...settingsKeys.all, 'detail'] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async () => {
      const response = await settingsApi.getSettings();
      return response.data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<SettingsData>) => settingsApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail() });
      toast.success('تم حفظ الإعدادات');
    },
    onError: (error: Error) => {
      toast.error('تعذر حفظ الإعدادات', { description: error.message });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      settingsApi.changePassword(payload),
    onSuccess: () => {
      toast.success('تم تحديث كلمة المرور');
    },
    onError: (error: Error) => {
      toast.error('تعذر تحديث كلمة المرور', { description: error.message });
    },
  });
}

export default useSettings;
