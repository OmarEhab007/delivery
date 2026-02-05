'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalHero } from '@/components/shared/portal-hero';
import { ShipmentsTable } from '@/components/tables/shipments-table';
import { AdvancedFilters } from '@/components/shared/advanced-filters';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useShipments } from '@/hooks/use-shipments';
import type { ShipmentStatus } from '@/types/api';

export default function MerchantShipmentsPage() {
  const [page, setPage] = useState(1);

  // URL-based filters
  const { filters, setFilter, resetFilters, hasActiveFilters } = useUrlFilters<{
    status: string | undefined;
    dateFrom: string | undefined;
    dateTo: string | undefined;
    origin: string | undefined;
    search: string | undefined;
  }>({
    defaults: { status: 'all' },
  });

  const { data, isLoading } = useShipments({
    page,
    limit: 10,
    status: filters.status && filters.status !== 'all' ? (filters.status as ShipmentStatus) : undefined,
    search: filters.search || undefined,
    fromDate: filters.dateFrom || undefined,
    toDate: filters.dateTo || undefined,
    origin: filters.origin || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const shipments = data?.data || [];
  const pagination = data?.pagination;

  const handleStatusFilter = (newStatus: ShipmentStatus | 'all') => {
    setFilter('status', newStatus === 'all' ? undefined : newStatus);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setFilter('search', query || undefined);
    setPage(1);
  };

  // Calculate active filter count
  const activeFilterCount = hasActiveFilters ? Object.values(filters).filter(v => v && v !== 'all').length : 0;

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

      {/* Advanced Filters */}
      <AdvancedFilters
        config={[
          {
            key: 'status',
            label: 'الحالة',
            type: 'select',
            options: [
              { label: 'مسودة', value: 'DRAFT' },
              { label: 'قيد المراجعة', value: 'PENDING_APPROVAL' },
              { label: 'معتمدة', value: 'APPROVED' },
              { label: 'قيد العرض', value: 'OPEN_FOR_BIDS' },
              { label: 'معينة', value: 'ASSIGNED' },
              { label: 'قيد التوصيل', value: 'IN_TRANSIT' },
              { label: 'تم التوصيل', value: 'DELIVERED' },
              { label: 'مكتملة', value: 'COMPLETED' },
            ],
          },
          {
            key: 'dateFrom',
            label: 'من تاريخ',
            type: 'date',
          },
          {
            key: 'dateTo',
            label: 'إلى تاريخ',
            type: 'date',
          },
          {
            key: 'origin',
            label: 'المنشأ',
            type: 'text',
            placeholder: 'بحث حسب المنشأ',
          },
        ]}
        values={filters}
        onChange={setFilter as (key: string, value: string | undefined) => void}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />

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
