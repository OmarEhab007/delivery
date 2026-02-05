'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DriversTable } from '@/components/tables/drivers-table';
import { AssignTruckDialog } from '@/components/shared/assign-driver-dialog';
import { useDrivers } from '@/hooks/use-drivers';
import { useAssignDriverToTruck } from '@/hooks/use-trucks';
import type { User as UserEntity } from '@/types/entities';

export default function DriversListPage() {
  const [page, setPage] = useState(1);
  const [assignTruckDriver, setAssignTruckDriver] = useState<UserEntity | null>(null);

  const { data, isLoading } = useDrivers({
    page,
    limit: 10,
    role: 'Driver',
  });

  const assignDriver = useAssignDriverToTruck();

  const drivers = data?.data || [];
  const pagination = data?.pagination;

  const handleAssignTruck = async (driverId: string, truckId: string) => {
    await assignDriver.mutateAsync({ id: truckId, data: { driverId } });
    setAssignTruckDriver(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">السائقون</h1>
            <p className="text-sm text-muted-foreground">
              {pagination?.total || 0} سائق مسجل
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/truck-owner/fleet/drivers/new">
            <Plus className="ml-2 h-4 w-4" />
            إضافة سائق
          </Link>
        </Button>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة السائقين</CardTitle>
        </CardHeader>
        <CardContent>
          <DriversTable
            drivers={drivers}
            isLoading={isLoading}
            onAssignTruck={(driver) => setAssignTruckDriver(driver)}
            currentPage={pagination?.page || 1}
            totalPages={pagination?.totalPages || 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Assign Truck Dialog */}
      <AssignTruckDialog
        driver={assignTruckDriver}
        open={!!assignTruckDriver}
        onOpenChange={(open) => !open && setAssignTruckDriver(null)}
        onAssign={handleAssignTruck}
        isLoading={assignDriver.isPending}
      />
    </div>
  );
}
