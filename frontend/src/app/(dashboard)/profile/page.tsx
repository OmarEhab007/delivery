'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingPage } from '@/components/ui/loading-spinner';

const roleProfilePath = (role?: string) => {
  if (!role) return '/login';
  if (role === 'Driver') return '/driver/profile';
  const normalized = role.toLowerCase().replace('owner', '-owner');
  return `/${normalized}/settings`;
};

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    router.replace(roleProfilePath(user?.role));
  }, [router, user]);

  return <LoadingPage message="جارٍ تحويلك إلى الملف الشخصي..." />;
}
