'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccessDeniedProps {
  message?: string;
  redirectPath?: string;
}

export function AccessDenied({
  message = 'ليس لديك صلاحية للوصول إلى هذه الصفحة.',
  redirectPath,
}: AccessDeniedProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (redirectPath) {
      router.push(redirectPath);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>تم رفض الوصول</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoBack}>العودة</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccessDenied;
