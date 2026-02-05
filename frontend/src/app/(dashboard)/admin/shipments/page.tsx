'use client';

import { ShipmentsTable } from '@/components/tables/shipments-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedFilters } from '@/components/shared/advanced-filters';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useAdminShipments } from '@/hooks/use-admin';
import type { ShipmentStatus } from '@/types/api';

export default function AdminShipmentsPage() {
  // URL-based filters
  const { filters, setFilter, resetFilters, hasActiveFilters } = useUrlFilters<{
    status: string | undefined;
    dateFrom: string | undefined;
    dateTo: string | undefined;
    search: string | undefined;
  }>({
    defaults: { status: 'all' },
  });

  const { data, isLoading } = useAdminShipments({
    status: filters.status && filters.status !== 'all' ? (filters.status as ShipmentStatus) : undefined,
    fromDate: filters.dateFrom || undefined,
    toDate: filters.dateTo || undefined,
    limit: 10,
  });

  const shipments = data?.data.shipments ?? [];

  const filteredShipments = filters.search
    ? shipments.filter((shipment) => shipment._id.includes(filters.search || ''))
    : shipments;

  const handleStatusFilter = (newStatus: ShipmentStatus | 'all') => {
    setFilter('status', newStatus === 'all' ? undefined : newStatus);
  };

  const handleSearch = (query: string) => {
    setFilter('search', query || undefined);
  };

  // Calculate active filter count
  const activeFilterCount = hasActiveFilters ? Object.values(filters).filter(v => v && v !== 'all').length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة الشحنات</h1>
        <p className="text-muted-foreground">مراجعة ومتابعة جميع الشحنات في المنصة</p>
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
        ]}
        values={filters}
        onChange={setFilter as (key: string, value: string | undefined) => void}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />

      <Card>
        <CardHeader>
          <CardTitle>قائمة الشحنات</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentsTable
            shipments={filteredShipments}
            isLoading={isLoading}
            onStatusFilter={handleStatusFilter}
            onSearch={handleSearch}
            baseUrl="/admin/shipments"
            emptyMessage="لا توجد شحنات لعرضها"
          />
        </CardContent>
      </Card>
    </div>
  );
}
