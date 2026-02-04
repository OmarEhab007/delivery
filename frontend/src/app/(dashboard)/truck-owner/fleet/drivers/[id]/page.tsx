'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Truck, Phone, Mail, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AssignTruckDialog } from '@/components/shared/assign-driver-dialog';
import { useDriver, useDriverAssignedShipments } from '@/hooks/use-drivers';
import { useAssignDriverToTruck } from '@/hooks/use-trucks';
import type { DriverStatus } from '@/types/api';

function getStatusBadge(status?: DriverStatus) {
  if (!status) {
    return <Badge variant="secondary">غير محدد</Badge>;
  }

  const statusConfig: Record<DriverStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ACTIVE: { label: 'نشط', variant: 'default' },
    OFF_DUTY: { label: 'خارج العمل', variant: 'outline' },
    ON_BREAK: { label: 'في استراحة', variant: 'secondary' },
    INACTIVE: { label: 'غير نشط', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function DriverDetailPage() {
  const params = useParams();
  const driverId = params.id as string;

  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const { data: driverData, isLoading } = useDriver(driverId);
  const { data: shipmentsData } = useDriverAssignedShipments(driverId);
  const assignDriver = useAssignDriverToTruck();

  const driver = driverData?.data;
  const assignedShipments = shipmentsData?.data || [];

  const handleAssignTruck = async (_driverId: string, truckId: string) => {
    await assignDriver.mutateAsync({ id: truckId, data: { driverId: _driverId } });
    setShowAssignDialog(false);
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

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">السائق غير موجود</p>
        <Button variant="link" asChild>
          <Link href="/truck-owner/fleet/drivers">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/truck-owner/fleet/drivers">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{driver.name}</h1>
            <p className="text-muted-foreground">{driver.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
            <Truck className="ml-2 h-4 w-4" />
            تعيين لشاحنة
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Driver Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>معلومات السائق</CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(driver.driverStatus)}
              {driver.isAvailable ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  متاح
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  غير متاح
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{driver.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{driver.phone}</span>
              </div>
            </div>

            <Separator />

            {/* License Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                معلومات الرخصة
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">رقم الرخصة</p>
                  <p className="font-medium font-mono">{driver.licenseNumber || '--'}</p>
                </div>
                {driver.driverLicense?.issuedBy && (
                  <div>
                    <p className="text-sm text-muted-foreground">جهة الإصدار</p>
                    <p className="font-medium">{driver.driverLicense.issuedBy}</p>
                  </div>
                )}
                {driver.driverLicense?.issueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الإصدار</p>
                    <p className="font-medium">{formatDate(driver.driverLicense.issueDate)}</p>
                  </div>
                )}
                {driver.driverLicense?.expiryDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                    <p className="font-medium">{formatDate(driver.driverLicense.expiryDate)}</p>
                  </div>
                )}
              </div>
              {driver.driverLicense && (
                <div className="flex items-center gap-2 pt-2">
                  {driver.driverLicense.verified ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      رخصة موثقة
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      رخصة غير موثقة
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Account Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                <p className="font-medium">{formatDate(driver.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">حالة الحساب</p>
                <p className="font-medium">
                  {driver.active ? 'نشط' : 'غير نشط'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Shipments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              الشحنات المعينة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedShipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد شحنات معينة حالياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedShipments.map((shipment) => (
                  <div
                    key={shipment._id}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">#{shipment._id.slice(-8)}</span>
                      <Badge variant="secondary">{shipment.status}</Badge>
                    </div>
                    <div className="text-sm">
                      <p>{shipment.origin.address.split(',')[0]}</p>
                      <p className="text-muted-foreground">→ {shipment.destination.address.split(',')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Truck Dialog */}
      <AssignTruckDialog
        driver={driver}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onAssign={handleAssignTruck}
        isLoading={assignDriver.isPending}
      />
    </div>
  );
}
