'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getTokens } from '@/lib/api';
import type { UserRole } from '@/types/api';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
  allowedRoles?: UserRole[];
}

export function useAuth(options: UseAuthOptions = {}) {
  const { redirectTo, redirectIfFound = false, allowedRoles } = options;
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initializeAuth, logout, refreshUser } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Handle redirects based on auth state
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && redirectTo && !redirectIfFound) {
      router.push(redirectTo);
    }

    if (isAuthenticated && redirectTo && redirectIfFound) {
      router.push(redirectTo);
    }

    // Check role-based access
    if (isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to their own dashboard
      const roleRedirectMap: Record<string, string> = {
        Admin: '/admin/dashboard',
        Merchant: '/merchant/dashboard',
        TruckOwner: '/truck-owner/dashboard',
        Driver: '/driver/dashboard',
      };
      router.push(roleRedirectMap[user.role] || '/');
    }
  }, [isLoading, isAuthenticated, redirectTo, redirectIfFound, allowedRoles, user, router]);

  // Check if token needs refresh (call periodically)
  const checkTokenRefresh = useCallback(async () => {
    const { accessToken } = getTokens();
    if (!accessToken) return;

    // Decode token to check expiry (basic JWT decode without verification)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to ms
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // If token expires in less than 5 minutes, refresh
      if (exp - now < fiveMinutes) {
        await refreshUser();
      }
    } catch {
      // If token is malformed, try to refresh
      await refreshUser();
    }
  }, [refreshUser]);

  // Set up token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately
    checkTokenRefresh();

    // Check every 4 minutes
    const interval = setInterval(checkTokenRefresh, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTokenRefresh]);

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false;
      if (Array.isArray(role)) {
        return role.includes(user.role);
      }
      return user.role === role;
    },
    [user]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    hasRole,
    refreshUser,
  };
}

export default useAuth;
