'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calendar,
} from 'lucide-react';
import { ShipmentStatusBadge } from '@/components/shared/status-badge';
import type { Shipment } from '@/types/entities';

interface DriverShipmentsTableProps {
  shipments: Shipment[];
  isLoading?: boolean;
  onStartDelivery?: (shipment: Shipment) => void;
  onCompleteDelivery?: (shipment: Shipment) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function DriverShipmentsTable({
  shipments,
  isLoading = false,
  onStartDelivery,
  onCompleteDelivery,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = 'لا توجد شحنات معينة',
}: DriverShipmentsTableProps) {
  const canStart = (shipment: Shipment) =>
    ['ASSIGNED', 'LOADING'].includes(shipment.status);

  const canComplete = (shipment: Shipment) =>
    ['IN_TRANSIT', 'UNLOADING', 'AT_BORDER'].includes(shipment.status);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-xl border bg-card/60 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
            <TableRow>
              <TableHead>رقم الشحنة</TableHead>
              <TableHead>المسار</TableHead>
              <TableHead>التاريخ المتوقع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-[150px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((shipment) => (
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
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(shipment.estimatedDeliveryDate || shipment.estimatedPickupDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ShipmentStatusBadge status={shipment.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {canStart(shipment) && onStartDelivery && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onStartDelivery(shipment)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="ml-1 h-3 w-3" />
                          بدء
                        </Button>
                      )}
                      {canComplete(shipment) && onCompleteDelivery && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onCompleteDelivery(shipment)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle2 className="ml-1 h-3 w-3" />
                          إتمام
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/driver/shipments/${shipment._id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            صفحة {currentPage} من {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverShipmentsTable;
