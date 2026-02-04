import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/login-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description: 'تسجيل الدخول إلى منصة اللوجستي',
};

function LoginFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
