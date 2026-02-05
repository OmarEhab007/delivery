'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  Search,
  ChevronRight,
  ChevronLeft,
  Package,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { Shipment } from '@/types/entities';

interface AvailableShipmentsTableProps {
  shipments: Shipment[];
  isLoading?: boolean;
  onSearch?: (query: string) => void;
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

function formatCurrency(amount?: number, currency = 'SAR') {
  if (!amount) return 'مزايدة';
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function AvailableShipmentsTable({
  shipments,
  isLoading = false,
  onSearch,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = 'لا توجد شحنات متاحة',
}: AvailableShipmentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      {onSearch && (
        <div className="rounded-xl border bg-card/60 p-3 max-w-xl">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالعنوان أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              بحث
            </Button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card/60 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
            <TableRow>
              <TableHead>من → إلى</TableHead>
              <TableHead>البضاعة</TableHead>
              <TableHead>الوزن</TableHead>
              <TableHead>تاريخ الاستلام</TableHead>
              <TableHead>التسعير</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((shipment) => (
                <TableRow key={shipment._id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {shipment.origin.address.split(',')[0]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {shipment.destination.address.split(',')[0]}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[120px]">
                        {shipment.cargoDetails.description}
                      </span>
                    </div>
                    {shipment.cargoDetails.hazardous && (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        خطرة
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {shipment.cargoDetails.weight} طن
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(shipment.estimatedPickupDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {shipment.pricingType === 'FIXED_PRICE'
                          ? formatCurrency(
                              shipment.fixedPriceDetails?.amount,
                              shipment.fixedPriceDetails?.currency
                            )
                          : 'مزايدة'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" asChild>
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

export default AvailableShipmentsTable;
