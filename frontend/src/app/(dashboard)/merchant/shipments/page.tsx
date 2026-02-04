'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalHero } from '@/components/shared/portal-hero';
import { ShipmentsTable } from '@/components/tables/shipments-table';
import { useShipments } from '@/hooks/use-shipments';
import type { ShipmentStatus } from '@/types/api';

export default function MerchantShipmentsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') as ShipmentStatus | null;

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ShipmentStatus | 'all'>(initialStatus || 'all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useShipments({
    page,
    limit: 10,
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const shipments = data?.data || [];
  const pagination = data?.pagination;

  const handleStatusFilter = (newStatus: ShipmentStatus | 'all') => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PortalHero
        title="إدارة الشحنات التجارية"
        subtitle="التاجر"
        description="تابع الشحنات، قارن العروض، وأنجز الإجراءات بسرعة من لوحة واحدة."
        imageSrc="/brand/merchant-hero.png"
        actionLabel="شحنة جديدة"
        actionHref="/merchant/shipments/new"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">شحناتي</h1>
            <p className="text-sm text-muted-foreground">
              {pagination?.total || 0} شحنة
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/merchant/shipments/new">
            <Plus className="ml-2 h-4 w-4" />
            شحنة جديدة
          </Link>
        </Button>
      </div>

      {/* Shipments Table */}
      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>قائمة الشحنات</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentsTable
            shipments={shipments}
            isLoading={isLoading}
            onStatusFilter={handleStatusFilter}
            onSearch={handleSearch}
            currentPage={pagination?.page || 1}
            totalPages={pagination?.totalPages || 1}
            onPageChange={setPage}
            baseUrl="/merchant/shipments"
            emptyMessage="لا توجد شحنات مطابقة للبحث"
          />
        </CardContent>
      </Card>
    </div>
  );
}
