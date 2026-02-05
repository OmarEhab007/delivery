'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DriverForm } from '@/components/forms/driver-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export default function AddDriverPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createDriver = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      password: string;
      licenseNumber: string;
      licenseIssueDate?: string;
      licenseExpiryDate?: string;
      licenseIssuedBy?: string;
      isAvailable: boolean;
    }) => {
      // Register driver (TruckOwner-protected endpoint)
      const response = await apiClient.post(API_ENDPOINTS.auth.registerDriver, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        licenseNumber: data.licenseNumber,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const handleSubmit = async (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    licenseNumber: string;
    licenseIssueDate?: string;
    licenseExpiryDate?: string;
    licenseIssuedBy?: string;
    isAvailable: boolean;
  }) => {
    await createDriver.mutateAsync({
      ...data,
      password: data.password || '',
    });
    router.push('/truck-owner/fleet/drivers');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/truck-owner/fleet/drivers">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تسجيل سائق جديد</h1>
            <p className="text-sm text-muted-foreground">
              أضف سائقاً جديداً إلى فريقك
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <DriverForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/truck-owner/fleet/drivers')}
          isLoading={createDriver.isPending}
        />
      </div>
    </div>
  );
}
