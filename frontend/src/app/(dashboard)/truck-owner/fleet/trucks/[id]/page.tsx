'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TruckDetailCard } from '@/components/shared/truck-detail-card';
import { MaintenanceHistory } from '@/components/shared/maintenance-history';
import { AssignDriverDialog } from '@/components/shared/assign-driver-dialog';
import { TruckDocumentsSection } from '@/components/shared/truck-documents-section';
import {
  useTruck,
  useDeleteTruck,
  useAssignDriverToTruck,
  useUnassignDriverFromTruck,
} from '@/hooks/use-trucks';

export default function TruckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const truckId = params.id as string;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const { data: truckData, isLoading } = useTruck(truckId);
  const deleteTruck = useDeleteTruck();
  const assignDriver = useAssignDriverToTruck();
  const unassignDriver = useUnassignDriverFromTruck();

  const truck = truckData?.data;

  const handleDelete = async () => {
    await deleteTruck.mutateAsync(truckId);
    router.push('/truck-owner/fleet');
  };

  const handleAssignDriver = async (truckId: string, driverId: string) => {
    await assignDriver.mutateAsync({ id: truckId, data: { driverId } });
    setShowAssignDialog(false);
  };

  const handleUnassignDriver = async () => {
    if (!truck?.driverId) return;
    await unassignDriver.mutateAsync(truckId);
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

  if (!truck) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">الشاحنة غير موجودة</p>
        <Button variant="link" asChild>
          <Link href="/truck-owner/fleet">العودة للقائمة</Link>
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
            <Link href="/truck-owner/fleet">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{truck.model}</h1>
            <p className="text-muted-foreground font-mono">{truck.plateNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {truck.driverId ? (
            <Button
              variant="outline"
              onClick={handleUnassignDriver}
              disabled={unassignDriver.isPending}
            >
              <User className="ml-2 h-4 w-4" />
              إلغاء تعيين السائق
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
              <User className="ml-2 h-4 w-4" />
              تعيين سائق
            </Button>
          )}
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="ml-2 h-4 w-4" />
            حذف
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Truck Details */}
        <TruckDetailCard truck={truck} />

        {/* Maintenance History */}
        <MaintenanceHistory records={truck.maintenanceHistory || []} />
      </div>

      {/* Documents */}
      <TruckDocumentsSection truckId={truckId} canUpload={true} canDelete={true} />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الشاحنة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الشاحنة {truck.plateNumber}؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Driver Dialog */}
      <AssignDriverDialog
        truck={truck}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onAssign={handleAssignDriver}
        isLoading={assignDriver.isPending}
      />
    </div>
  );
}
