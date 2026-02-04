'use client';

import Link from 'next/link';
import {
  Package,
  Truck,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '@/components/shared/stats-cards';
import { PortalHero } from '@/components/shared/portal-hero';
import { AvailableShipmentsTable } from '@/components/tables/available-shipments-table';
import { useShipments } from '@/hooks/use-shipments';
import { useMyApplications } from '@/hooks/use-applications';
import { useMyTrucks } from '@/hooks/use-trucks';

export default function TruckOwnerDashboardPage() {
  // Fetch available shipments (status: REQUESTED for bidding)
  const { data: shipmentsData, isLoading: shipmentsLoading } = useShipments({
    status: 'REQUESTED',
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch my applications
  const { data: applicationsData, isLoading: applicationsLoading } = useMyApplications({
    limit: 100,
  });

  // Fetch my trucks
  const { data: trucksData, isLoading: trucksLoading } = useMyTrucks();

  const shipments = shipmentsData?.data || [];
  const applications = applicationsData?.data || [];
  const trucks = trucksData?.data || [];

  // Calculate stats
  const availableShipments = shipmentsData?.pagination?.total || 0;
  const pendingApplications = applications.filter((a) => a.status === 'PENDING').length;
  const acceptedApplications = applications.filter((a) => a.status === 'ACCEPTED').length;
  const availableTrucks = trucks.filter((t) => t.available && t.status === 'AVAILABLE').length;

  const stats = [
    {
      title: 'شحنات متاحة',
      value: availableShipments,
      description: 'للمزايدة',
      icon: Package,
      variant: 'primary' as const,
    },
    {
      title: 'عروضي المعلقة',
      value: pendingApplications,
      description: 'قيد المراجعة',
      icon: Clock,
      variant: 'warning' as const,
    },
    {
      title: 'عروض مقبولة',
      value: acceptedApplications,
      description: 'تم القبول',
      icon: CheckCircle2,
      variant: 'success' as const,
    },
    {
      title: 'شاحنات متاحة',
      value: `${availableTrucks}/${trucks.length}`,
      description: 'جاهزة للعمل',
      icon: Truck,
    },
  ];

  const isLoading = shipmentsLoading || applicationsLoading || trucksLoading;

  return (
    <div className="space-y-6">
      <PortalHero
        title="مرحباً بك في بوابة مالك الشاحنة"
        subtitle="مالك الشاحنة"
        description="قدّم عروضك، راقب أسطولك، وتابع الشحنات المتاحة أولاً بأول."
        imageSrc="/brand/truckowner-hero.png"
        actionLabel="تصفح الشحنات"
        actionHref="/truck-owner/shipments"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">
            مرحباً بك، إليك ملخص نشاطك
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/truck-owner/fleet">
              <Truck className="ml-2 h-4 w-4" />
              إدارة الأسطول
            </Link>
          </Button>
          <Button asChild>
            <Link href="/truck-owner/shipments">
              <Package className="ml-2 h-4 w-4" />
              تصفح الشحنات
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          <Link href="/truck-owner/shipments">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">تصفح الشحنات</h3>
                <p className="text-sm text-muted-foreground">
                  {availableShipments} شحنة متاحة
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          <Link href="/truck-owner/applications">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 dark:bg-yellow-500/20">
                <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold">عروضي</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingApplications} عرض معلق
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          <Link href="/truck-owner/fleet">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
                <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">الأسطول</h3>
                <p className="text-sm text-muted-foreground">
                  {trucks.length} شاحنة
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Available Shipments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>أحدث الشحنات المتاحة</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/truck-owner/shipments">عرض الكل</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <AvailableShipmentsTable
            shipments={shipments}
            isLoading={shipmentsLoading}
            emptyMessage="لا توجد شحنات متاحة حالياً"
          />
        </CardContent>
      </Card>
    </div>
  );
}
