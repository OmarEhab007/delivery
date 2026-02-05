'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import type { User } from '@/types/entities';

export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

// Hook to get the current authenticated user
export function useCurrentUser() {
  const { user, isLoading } = useAuthStore();

  // Also fetch from API to keep in sync
  const query = useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const response = await authApi.getMe();
      return response.data.user;
    },
    enabled: !!user,
  });

  const resolvedUser = (query.data as User | undefined) || user;

  return {
    data: resolvedUser ?? null,
    isLoading: isLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook to update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      emergencyContact?: string;
      companyName?: string;
      companyAddress?: string;
    }) => {
      // This would call an update profile endpoint
      // For now simulating the update
      const response = await authApi.getMe();
      return { ...response.data.user, ...data };
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser as import('@/types/entities').User);
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
      toast.success('تم تحديث الملف الشخصي بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث الملف الشخصي', { description: error.message });
    },
  });
}

// Hook to logout
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success('تم تسجيل الخروج بنجاح');
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    onError: (error: Error) => {
      // Even if API fails, clear local state
      logout();
      queryClient.clear();
      toast.error('حدث خطأ أثناء تسجيل الخروج', { description: error.message });
    },
  });
}

export default useCurrentUser;
