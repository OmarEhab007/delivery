'use client';

import { BidsTable } from '@/components/tables/bids-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminApplications, useAdminUpdateApplicationStatus } from '@/hooks/use-admin';
import type { Application } from '@/types/entities';

export default function AdminApplicationsPage() {
  const { data, isLoading } = useAdminApplications({ limit: 10 });
  const updateStatus = useAdminUpdateApplicationStatus();

  const applications = data?.data.applications ?? [];

  const handleAccept = (application: Application) => {
    updateStatus.mutate({ id: application._id, status: 'ACCEPTED' });
  };

  const handleReject = (application: Application) => {
    updateStatus.mutate({ id: application._id, status: 'REJECTED' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
        <p className="text-muted-foreground">متابعة عروض النقل والطلبات المقدمة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الطلبات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <BidsTable
            applications={applications}
            isLoading={isLoading}
            onAccept={handleAccept}
            onReject={handleReject}
            canManage
            emptyMessage="لا توجد طلبات حالياً"
          />
        </CardContent>
      </Card>
    </div>
  );
}
