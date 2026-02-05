'use client';

import { RegistrationsTable } from '@/components/tables/registrations-table';
import { useRegistrationRequests, useApproveRegistration, useRejectRegistration } from '@/hooks/use-admin';
import type { User } from '@/types/entities';
import { Skeleton } from '@/components/ui/skeleton';

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">طلبات التسجيل</h1>
      <p className="text-muted-foreground">مراجعة والموافقة على طلبات التسجيل الجديدة</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function RegistrationsPage() {
  const { data: registrationsResponse, isLoading } = useRegistrationRequests();
  const approveMutation = useApproveRegistration();
  const rejectMutation = useRejectRegistration();

  // Map RegistrationRequest to User for table compatibility
  const registrations = (registrationsResponse?.data?.requests || []).map((req) => ({
    _id: req._id,
    name: req.payload.name,
    email: req.payload.email,
    phone: req.payload.phone,
    role: req.role,
    approvalStatus: req.state,
    active: req.state === 'APPROVED',
    createdAt: req.createdAt,
    updatedAt: req.createdAt,
  })) as User[];

  const handleApprove = (user: User) => {
    approveMutation.mutate(user._id);
  };

  const handleReject = (user: User, reason: string) => {
    rejectMutation.mutate({ id: user._id, reason });
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader />

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <RegistrationsTable
          registrations={registrations}
          isLoading={isLoading}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
