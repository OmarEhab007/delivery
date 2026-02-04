'use client';

import Link from 'next/link';
import { Package, Eye, MapPin, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalHero } from '@/components/shared/portal-hero';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShipmentStatusBadge } from '@/components/shared/status-badge';
import { useShipments } from '@/hooks/use-shipments';

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function AssignedShipmentsPage() {
  // Fetch assigned shipments (those with status indicating active assignment)
  const { data, isLoading } = useShipments({
    page: 1,
    limit: 10,
    // Filter for shipments that are assigned (have a truck/driver assigned)
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const shipments = data?.data || [];

  // Filter to only show shipments that are assigned to this truck owner's fleet
  // In a real app, this would be filtered on the backend
  const assignedShipments = shipments.filter((s) =>
    s.assignedTruckId &&
    ['ASSIGNED', 'LOADING', 'IN_TRANSIT', 'AT_BORDER', 'UNLOADING', 'DELIVERED'].includes(s.status)
  );

  return (
    <div className="space-y-6">
      <PortalHero
        title="الشحنات المعينة لأسطولك"
        subtitle="مالك الشاحنة"
        description="تابع الشحنات الجارية، السائقين، ومراحل التسليم في مكان واحد."
        imageSrc="/brand/truckowner-hero.png"
      />
      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border bg-card/70 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">الشحنات المعينة</h1>
          <p className="text-sm text-muted-foreground">
            الشحنات المعينة لأسطولك
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.08),rgba(241,214,178,0.35))]">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {assignedShipments.filter((s) => s.status === 'ASSIGNED' || s.status === 'LOADING').length}
            </div>
            <p className="text-sm text-muted-foreground">في انتظار البدء</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.06),rgba(255,244,230,0.6))]">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {assignedShipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'AT_BORDER').length}
            </div>
            <p className="text-sm text-muted-foreground">في الطريق</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.08),rgba(241,214,178,0.35))]">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {assignedShipments.filter((s) => s.status === 'DELIVERED' || s.status === 'UNLOADING').length}
            </div>
            <p className="text-sm text-muted-foreground">وصلت للوجهة</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>قائمة الشحنات المعينة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-card/60 shadow-sm">
            <Table>
              <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
                <TableRow>
                  <TableHead>رقم الشحنة</TableHead>
                  <TableHead>المسار</TableHead>
                  <TableHead>الشاحنة</TableHead>
                  <TableHead>السائق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : assignedShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا توجد شحنات معينة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  assignedShipments.map((shipment) => (
                    <TableRow key={shipment._id}>
                      <TableCell>
                        <span className="font-mono">#{shipment._id.slice(-8)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span className="text-sm truncate max-w-[150px]">
                              {shipment.origin.address.split(',')[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {shipment.destination.address.split(',')[0]}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {shipment.assignedTruck ? (
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{shipment.assignedTruck.plateNumber}</span>
                          </div>
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell>
                        {shipment.assignedDriver ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{shipment.assignedDriver.name}</span>
                          </div>
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell>
                        <ShipmentStatusBadge status={shipment.status} />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/truck-owner/shipments/${shipment._id}`}>
                            <Eye className="ml-2 h-4 w-4" />
                            تفاصيل
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
