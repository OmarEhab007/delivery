'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingPage } from '@/components/ui/loading-spinner';

const roleSettingsPath = (role?: string) => {
  if (!role) return '/login';
  const normalized = role.toLowerCase().replace('owner', '-owner');
  return `/${normalized}/settings`;
};

export default function SettingsRedirectPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    router.replace(roleSettingsPath(user?.role));
  }, [router, user]);

  return <LoadingPage message="جارٍ تحويلك إلى الإعدادات..." />;
}
