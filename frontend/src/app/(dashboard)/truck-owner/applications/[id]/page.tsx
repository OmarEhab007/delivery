'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Edit, XCircle, Truck, User, DollarSign, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ApplicationStatusBadge } from '@/components/shared/status-badge';
import { ShipmentDetailCard } from '@/components/shared/shipment-detail-card';
import { EditBidDialog, CancelBidDialog } from '@/components/shared/edit-bid-dialog';
import { useApplication, useUpdateApplication, useCancelApplication } from '@/hooks/use-applications';

function formatCurrency(amount: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: applicationData, isLoading } = useApplication(applicationId);
  const updateApplication = useUpdateApplication();
  const cancelApplication = useCancelApplication();

  const application = applicationData?.data;

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
    setShowEditDialog(false);
  };

  const handleConfirmCancel = async (id: string) => {
    await cancelApplication.mutateAsync(id);
    setShowCancelDialog(false);
    router.push('/truck-owner/applications');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">العرض غير موجود</p>
        <Button variant="link" asChild>
          <Link href="/truck-owner/applications">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  const canEdit = application.status === 'PENDING';
  const canCancel = application.status === 'PENDING';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/truck-owner/applications">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تفاصيل العرض</h1>
            <p className="text-muted-foreground font-mono">#{applicationId.slice(-8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Edit className="ml-2 h-4 w-4" />
              تعديل
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
              <XCircle className="ml-2 h-4 w-4" />
              إلغاء
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>تفاصيل العرض</CardTitle>
            <ApplicationStatusBadge status={application.status} size="lg" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">السعر المقترح</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(application.bidDetails.price, application.bidDetails.currency)}
              </p>
            </div>

            <Separator />

            {/* Truck */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                الشاحنة
              </div>
              {application.assignedTruck ? (
                <div className="rounded-lg border p-3">
                  <p className="font-medium">{application.assignedTruck.model}</p>
                  <p className="text-sm text-muted-foreground">
                    {application.assignedTruck.plateNumber} • {application.assignedTruck.capacity} طن
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">--</p>
              )}
            </div>

            {/* Driver */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                السائق
              </div>
              {application.driver ? (
                <div className="rounded-lg border p-3">
                  <p className="font-medium">{application.driver.name}</p>
                  <p className="text-sm text-muted-foreground">{application.driver.phone}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">--</p>
              )}
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  تاريخ التقديم
                </div>
                <p className="font-medium">{formatDate(application.createdAt)}</p>
              </div>
              {application.bidDetails.validUntil && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    صالح حتى
                  </div>
                  <p className="font-medium">{formatDate(application.bidDetails.validUntil)}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {application.bidDetails.notes && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <FileText className="h-4 w-4" />
                    ملاحظات
                  </div>
                  <p className="text-sm rounded-lg bg-muted p-3">
                    {application.bidDetails.notes}
                  </p>
                </div>
              </>
            )}

            {/* Rejection Reason */}
            {application.status === 'REJECTED' && application.rejectionReason && (
              <>
                <Separator />
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm font-medium text-destructive mb-1">سبب الرفض</p>
                  <p className="text-sm">{application.rejectionReason}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Shipment Details */}
        {application.shipment ? (
          <ShipmentDetailCard shipment={application.shipment} showAssignment={false} />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">تفاصيل الشحنة غير متاحة</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <EditBidDialog
        application={application}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleSaveEdit}
        isLoading={updateApplication.isPending}
      />

      {/* Cancel Dialog */}
      <CancelBidDialog
        application={application}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleConfirmCancel}
        isLoading={cancelApplication.isPending}
      />
    </div>
  );
}
