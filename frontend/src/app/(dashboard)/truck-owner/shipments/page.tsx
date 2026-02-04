'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalHero } from '@/components/shared/portal-hero';
import { AvailableShipmentsTable } from '@/components/tables/available-shipments-table';
import { useShipments } from '@/hooks/use-shipments';

export default function TruckOwnerShipmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useShipments({
    page,
    limit: 10,
    status: 'REQUESTED', // Only show shipments open for bidding
    search: search || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const shipments = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PortalHero
        title="الشحنات المفتوحة للمزايدة"
        subtitle="مالك الشاحنة"
        description="استعرض الشحنات المتاحة وقدم عروضك بسرعة مع تفاصيل واضحة."
        imageSrc="/brand/truckowner-hero.png"
      />
      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border bg-card/70 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">الشحنات المتاحة</h1>
          <p className="text-sm text-muted-foreground">
            {pagination?.total || 0} شحنة متاحة للمزايدة
          </p>
        </div>
      </div>

      {/* Shipments Table */}
      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>تصفح الشحنات وقدم عروضك</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailableShipmentsTable
            shipments={shipments}
            isLoading={isLoading}
            onSearch={handleSearch}
            currentPage={pagination?.page || 1}
            totalPages={pagination?.totalPages || 1}
            onPageChange={setPage}
            emptyMessage="لا توجد شحنات متاحة حالياً"
          />
        </CardContent>
      </Card>
    </div>
  );
}
