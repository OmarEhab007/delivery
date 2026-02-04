'use client';

/**
 * Auth Provider - Handles auth initialization
 */

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}

export default AuthProvider;
