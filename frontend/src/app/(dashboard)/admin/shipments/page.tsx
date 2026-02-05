'use client';

import { useState } from 'react';
import { ShipmentsTable } from '@/components/tables/shipments-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminShipments } from '@/hooks/use-admin';
import type { ShipmentStatus } from '@/types/api';

export default function AdminShipmentsPage() {
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useAdminShipments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 10,
  });

  const shipments = data?.data.shipments ?? [];

  const filteredShipments = searchQuery
    ? shipments.filter((shipment) => shipment._id.includes(searchQuery))
    : shipments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة الشحنات</h1>
        <p className="text-muted-foreground">مراجعة ومتابعة جميع الشحنات في المنصة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الشحنات</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentsTable
            shipments={filteredShipments}
            isLoading={isLoading}
            onStatusFilter={setStatusFilter}
            onSearch={setSearchQuery}
            baseUrl="/admin/shipments"
            emptyMessage="لا توجد شحنات لعرضها"
          />
        </CardContent>
      </Card>
    </div>
  );
}
