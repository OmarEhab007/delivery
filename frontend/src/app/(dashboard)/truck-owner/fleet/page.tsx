'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Truck, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortalHero } from '@/components/shared/portal-hero';
import { TrucksTable } from '@/components/tables/trucks-table';
import { DriversTable } from '@/components/tables/drivers-table';
import { AssignDriverDialog, AssignTruckDialog } from '@/components/shared/assign-driver-dialog';
import { useMyTrucks, useAssignDriverToTruck } from '@/hooks/use-trucks';
import { useDrivers } from '@/hooks/use-drivers';
import type { Truck as TruckEntity, User as UserEntity } from '@/types/entities';

export default function FleetManagementPage() {
  const [driverPage, setDriverPage] = useState(1);

  // Assign dialogs
  const [assignDriverTruck, setAssignDriverTruck] = useState<TruckEntity | null>(null);
  const [assignTruckDriver, setAssignTruckDriver] = useState<UserEntity | null>(null);

  // Fetch trucks
  const { data: trucksData, isLoading: trucksLoading } = useMyTrucks();
  const trucks = trucksData?.data || [];

  // Fetch drivers (owned by this truck owner)
  const { data: driversData, isLoading: driversLoading } = useDrivers({
    page: driverPage,
    limit: 10,
    role: 'Driver',
  });
  const drivers = driversData?.data || [];
  const driversPagination = driversData?.pagination;

  const assignDriver = useAssignDriverToTruck();

  // Stats
  const totalTrucks = trucks.length;
  const availableTrucks = trucks.filter((t) => t.available && t.status === 'AVAILABLE').length;
  const totalDrivers = driversPagination?.total || drivers.length;
  const availableDrivers = drivers.filter((d) => d.isAvailable).length;

  const handleAssignDriverToTruck = async (truckId: string, driverId: string) => {
    await assignDriver.mutateAsync({ id: truckId, data: { driverId } });
    setAssignDriverTruck(null);
  };

  const handleAssignTruckToDriver = async (driverId: string, truckId: string) => {
    await assignDriver.mutateAsync({ id: truckId, data: { driverId } });
    setAssignTruckDriver(null);
  };

  return (
    <div className="space-y-6">
      <PortalHero
        title="إدارة الأسطول بوضوح"
        subtitle="مالك الشاحنة"
        description="راقب الشاحنات والسائقين، وحدد التوفر، ونظم الأسطول من مكان واحد."
        imageSrc="/brand/truckowner-hero.png"
        actionLabel="إضافة شاحنة"
        actionHref="/truck-owner/fleet/trucks/new"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة الأسطول</h1>
            <p className="text-sm text-muted-foreground">
              إدارة الشاحنات والسائقين
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/truck-owner/fleet/drivers/new">
              <Users className="ml-2 h-4 w-4" />
              إضافة سائق
            </Link>
          </Button>
          <Button asChild>
            <Link href="/truck-owner/fleet/trucks/new">
              <Plus className="ml-2 h-4 w-4" />
              إضافة شاحنة
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.08),rgba(241,214,178,0.35))]">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalTrucks}</div>
            <p className="text-sm text-muted-foreground">إجمالي الشاحنات</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.06),rgba(255,244,230,0.6))]">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{availableTrucks}</div>
            <p className="text-sm text-muted-foreground">شاحنات متاحة</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.08),rgba(241,214,178,0.35))]">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalDrivers}</div>
            <p className="text-sm text-muted-foreground">إجمالي السائقين</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.06),rgba(255,244,230,0.6))]">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{availableDrivers}</div>
            <p className="text-sm text-muted-foreground">سائقون متاحون</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trucks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trucks" className="gap-2">
            <Truck className="h-4 w-4" />
            الشاحنات
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <Users className="h-4 w-4" />
            السائقون
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trucks">
          <Card className="border-border/60 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>قائمة الشاحنات</CardTitle>
              <Button size="sm" asChild>
                <Link href="/truck-owner/fleet/trucks/new">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة شاحنة
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <TrucksTable
                trucks={trucks}
                isLoading={trucksLoading}
                onAssignDriver={(truck) => setAssignDriverTruck(truck)}
                emptyMessage="لا توجد شاحنات مسجلة"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card className="border-border/60 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>قائمة السائقين</CardTitle>
              <Button size="sm" asChild>
                <Link href="/truck-owner/fleet/drivers/new">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة سائق
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <DriversTable
                drivers={drivers}
                isLoading={driversLoading}
                onAssignTruck={(driver) => setAssignTruckDriver(driver)}
                currentPage={driversPagination?.page || 1}
                totalPages={driversPagination?.totalPages || 1}
                onPageChange={setDriverPage}
                emptyMessage="لا يوجد سائقون مسجلون"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Driver Dialog */}
      <AssignDriverDialog
        truck={assignDriverTruck}
        open={!!assignDriverTruck}
        onOpenChange={(open) => !open && setAssignDriverTruck(null)}
        onAssign={handleAssignDriverToTruck}
        isLoading={assignDriver.isPending}
      />

      {/* Assign Truck Dialog */}
      <AssignTruckDialog
        driver={assignTruckDriver}
        open={!!assignTruckDriver}
        onOpenChange={(open) => !open && setAssignTruckDriver(null)}
        onAssign={handleAssignTruckToDriver}
        isLoading={assignDriver.isPending}
      />
    </div>
  );
}
