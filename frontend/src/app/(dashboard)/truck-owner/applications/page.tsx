'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MyApplicationsTable } from '@/components/tables/my-applications-table';
import { EditBidDialog, CancelBidDialog } from '@/components/shared/edit-bid-dialog';
import { useMyApplications, useUpdateApplication, useCancelApplication } from '@/hooks/use-applications';
import type { Application } from '@/types/entities';
import type { ApplicationStatus } from '@/types/api';

export default function TruckOwnerApplicationsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all');

  // Edit/Cancel dialog state
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [cancelingApplication, setCancelingApplication] = useState<Application | null>(null);

  const { data, isLoading } = useMyApplications({
    page,
    limit: 10,
    status: status !== 'all' ? status : undefined,
  });

  const updateApplication = useUpdateApplication();
  const cancelApplication = useCancelApplication();

  const applications = data?.data || [];
  const pagination = data?.pagination;

  const handleStatusFilter = (newStatus: ApplicationStatus | 'all') => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
  };

  const handleCancel = (application: Application) => {
    setCancelingApplication(application);
  };

  const handleSaveEdit = async (id: string, data: { price: number; currency: string; notes?: string; validUntil?: string }) => {
    await updateApplication.mutateAsync({
      id,
      data: {
        bidDetails: {
          price: data.price,
          notes: data.notes,
          validUntil: data.validUntil,
        },
      },
    });
    setEditingApplication(null);
  };

  const handleConfirmCancel = async (id: string) => {
    await cancelApplication.mutateAsync(id);
    setCancelingApplication(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">عروضي</h1>
          <p className="text-sm text-muted-foreground">
            {pagination?.total || 0} عرض مقدم
          </p>
        </div>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع العروض المقدمة</CardTitle>
        </CardHeader>
        <CardContent>
          <MyApplicationsTable
            applications={applications}
            isLoading={isLoading}
            onStatusFilter={handleStatusFilter}
            onEdit={handleEdit}
            onCancel={handleCancel}
            currentPage={pagination?.page || 1}
            totalPages={pagination?.totalPages || 1}
            onPageChange={setPage}
            emptyMessage="لم تقدم أي عروض بعد"
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditBidDialog
        application={editingApplication}
        open={!!editingApplication}
        onOpenChange={(open) => !open && setEditingApplication(null)}
        onSave={handleSaveEdit}
        isLoading={updateApplication.isPending}
      />

      {/* Cancel Dialog */}
      <CancelBidDialog
        application={cancelingApplication}
        open={!!cancelingApplication}
        onOpenChange={(open) => !open && setCancelingApplication(null)}
        onConfirm={handleConfirmCancel}
        isLoading={cancelApplication.isPending}
      />
    </div>
  );
}
