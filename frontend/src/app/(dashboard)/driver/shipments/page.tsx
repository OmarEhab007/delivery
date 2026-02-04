'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDriverShipments } from '@/hooks/use-drivers';
import { DriverShipmentsTable } from '@/components/tables/driver-shipments-table';
import { PortalHero } from '@/components/shared/portal-hero';
import type { ShipmentStatus } from '@/types/api';

const statusTabs: { value: string; label: string; statuses: ShipmentStatus[] }[] = [
  { value: 'all', label: 'الكل', statuses: [] },
  { value: 'active', label: 'النشطة', statuses: ['ASSIGNED', 'LOADING', 'IN_TRANSIT', 'AT_BORDER', 'UNLOADING'] },
  { value: 'pending', label: 'قيد الانتظار', statuses: ['ASSIGNED'] },
  { value: 'completed', label: 'المكتملة', statuses: ['DELIVERED'] },
];

export default function DriverShipmentsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  const currentStatuses = statusTabs.find(t => t.value === activeTab)?.statuses || [];

  const { data, isLoading, refetch } = useDriverShipments({
    page,
    limit: 10,
    shipmentStatus: currentStatuses.length > 0 ? currentStatuses[0] : undefined,
  });

  const shipments = data?.data || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return <ShipmentsPageSkeleton />;
  }

  // Calculate stats
  const activeCount = shipments.filter(s =>
    ['ASSIGNED', 'LOADING', 'IN_TRANSIT', 'AT_BORDER', 'UNLOADING'].includes(s.status)
  ).length;
  const pendingCount = shipments.filter(s => s.status === 'ASSIGNED').length;
  const completedCount = shipments.filter(s => s.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      <PortalHero
        title="إدارة الشحنات اليومية"
        subtitle="السائق"
        description="اطّلع على الشحنات المخصصة لك، وحدّث حالاتها بسرعة."
        imageSrc="/brand/driver-hero.png"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">شحناتي</h1>
          <p className="text-muted-foreground">إدارة ومتابعة الشحنات المخصصة لك</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="ml-2 h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 bg-[linear-gradient(135deg,_hsl(var(--primary)_/_0.08),_hsl(var(--muted)_/_0.45))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشحنات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-[linear-gradient(135deg,_hsl(var(--primary)_/_0.06),_hsl(var(--background)_/_0.8))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">النشطة</CardTitle>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-[linear-gradient(135deg,_hsl(var(--primary)_/_0.06),_hsl(var(--background)_/_0.8))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-[linear-gradient(135deg,_hsl(var(--primary)_/_0.08),_hsl(var(--muted)_/_0.45))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المكتملة</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardContent className="pt-6">
                <DriverShipmentsTable
                  shipments={shipments.filter(s =>
                    tab.statuses.length === 0 || tab.statuses.includes(s.status)
                  )}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}

function ShipmentsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
