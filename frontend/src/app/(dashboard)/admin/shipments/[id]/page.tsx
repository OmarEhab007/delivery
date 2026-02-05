'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, XCircle, ShieldCheck, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ShipmentDetailCard } from '@/components/shared/shipment-detail-card';
import { ShipmentTimeline } from '@/components/shared/shipment-timeline';
import {
  useAdminShipment,
  useAdminApproveShipment,
  useAdminRejectShipment,
  useAdminAssignShipment,
  useAdminUpdateShipmentStatus,
  useAdminUsers,
  useAdminTrucks,
} from '@/hooks/use-admin';
import type { ShipmentStatus } from '@/types/api';

const statusOptions: ShipmentStatus[] = [
  'PENDING_APPROVAL',
  'REQUESTED',
  'CONFIRMED',
  'ASSIGNED',
  'LOADING',
  'IN_TRANSIT',
  'AT_BORDER',
  'UNLOADING',
  'DELIVERED',
  'COMPLETED',
  'DELAYED',
  'CANCELLED',
  'REJECTED',
];

export default function AdminShipmentDetailsPage() {
  const params = useParams();
  const shipmentId = params.id as string;

  const { data, isLoading } = useAdminShipment(shipmentId);
  const shipment = data?.data.shipment;

  const approveShipment = useAdminApproveShipment();
  const rejectShipment = useAdminRejectShipment();
  const assignShipment = useAdminAssignShipment();
  const updateStatus = useAdminUpdateShipmentStatus();

  const { data: driversData } = useAdminUsers({ role: 'Driver', page: 1, limit: 100 });
  const { data: trucksData } = useAdminTrucks({ page: 1, limit: 100 });

  const drivers = driversData?.data.users ?? [];
  const trucks = trucksData?.data.trucks ?? [];

  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus | ''>('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);

  const approvalState = shipment?.approval?.state;

  const statusLabel = useMemo(() => {
    if (!shipment?.status) return '--';
    return shipment.status;
  }, [shipment?.status]);

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

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">الشحنة غير موجودة</p>
        <Button variant="link" asChild>
          <Link href="/admin/shipments">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/shipments">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تفاصيل الشحنة</h1>
          <p className="text-muted-foreground font-mono">#{shipmentId.slice(-8)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <ShipmentDetailCard shipment={shipment} showAssignment />

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                حالة الامتثال
              </CardTitle>
              <Badge variant={shipment.compliance?.status === 'READY' ? 'default' : 'secondary'}>
                {shipment.compliance?.status || 'PENDING'}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">رقم ACID</p>
                <p className="font-medium">{shipment.compliance?.acidNumber || '--'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">الوسيط (Broker)</p>
                <p className="font-medium">{shipment.compliance?.brokerId || '--'}</p>
              </div>
            </CardContent>
          </Card>

          <ShipmentTimeline entries={shipment.timeline || []} />
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الحالة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الحالة الحالية</span>
                <Badge variant="secondary">{statusLabel}</Badge>
              </div>
              <Select
                value={selectedStatus || shipment.status}
                onValueChange={(value) => setSelectedStatus(value as ShipmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={() =>
                  updateStatus.mutate({
                    id: shipmentId,
                    status: selectedStatus || shipment.status,
                  })
                }
                disabled={updateStatus.isPending}
              >
                تحديث الحالة
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تعيين سائق/شاحنة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" /> السائق
                </div>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السائق" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver._id} value={driver._id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4" /> الشاحنة
                </div>
                <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشاحنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((truck) => (
                      <SelectItem key={truck._id} value={truck._id}>
                        {truck.plateNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  assignShipment.mutate({
                    id: shipmentId,
                    driverId: selectedDriver,
                    assignedTruckId: selectedTruck || undefined,
                  })
                }
                disabled={!selectedDriver || assignShipment.isPending}
              >
                تعيين الشحنة
              </Button>
              <p className="text-xs text-muted-foreground">
                ملاحظة: التعيين متاح فقط إذا كانت الشحنة في حالة REQUESTED أو CONFIRMED.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الموافقة الإدارية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">حالة الموافقة</span>
                <Badge variant="secondary">{approvalState || 'PENDING'}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => approveShipment.mutate(shipmentId)}
                  disabled={approvalState !== 'PENDING' || approveShipment.isPending}
                >
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                  اعتماد
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={approvalState !== 'PENDING'}
                >
                  <XCircle className="ml-2 h-4 w-4" />
                  رفض
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>سبب الرفض</DialogTitle>
          </DialogHeader>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="سبب الرفض (اختياري)"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                rejectShipment.mutate({ id: shipmentId, reason: rejectReason || undefined });
                setRejectOpen(false);
              }}
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
