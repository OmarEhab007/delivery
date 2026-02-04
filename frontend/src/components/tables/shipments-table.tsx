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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ShipmentStatusBadge } from '@/components/shared/status-badge';
import {
  Eye,
  MoreHorizontal,
  Search,
  ChevronRight,
  ChevronLeft,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Shipment } from '@/types/entities';
import type { ShipmentStatus } from '@/types/api';

interface ShipmentsTableProps {
  shipments: Shipment[];
  isLoading?: boolean;
  onStatusFilter?: (status: ShipmentStatus | 'all') => void;
  onSearch?: (query: string) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  baseUrl?: string;
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
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

const statusOptions: { value: ShipmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'PENDING_APPROVAL', label: 'في انتظار الموافقة' },
  { value: 'REQUESTED', label: 'مطلوبة' },
  { value: 'CONFIRMED', label: 'مؤكدة' },
  { value: 'ASSIGNED', label: 'تم التعيين' },
  { value: 'IN_TRANSIT', label: 'في الطريق' },
  { value: 'DELIVERED', label: 'تم التسليم' },
  { value: 'COMPLETED', label: 'مكتملة' },
  { value: 'CANCELLED', label: 'ملغاة' },
];

export function ShipmentsTable({
  shipments,
  isLoading = false,
  onStatusFilter,
  onSearch,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  baseUrl = '/merchant/shipments',
  emptyMessage = 'لا توجد شحنات',
}: ShipmentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-xl border bg-card/60 p-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالعنوان أو الرقم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              بحث
            </Button>
          </form>

          {onStatusFilter && (
            <Select
              defaultValue="all"
              onValueChange={(value) => onStatusFilter(value as ShipmentStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="فلترة بالحالة" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card/60 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
            <TableRow>
              <TableHead className="w-[100px]">الرقم</TableHead>
              <TableHead>من</TableHead>
              <TableHead>إلى</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الاستلام</TableHead>
              <TableHead className="w-[50px]"></TableHead>
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
                  <TableCell className="font-mono text-xs">
                    #{shipment._id.slice(-8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {shipment.origin.address.split(',')[0]}
                        </p>
                        {shipment.origin.country && (
                          <p className="text-xs text-muted-foreground">
                            {shipment.origin.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {shipment.destination.address.split(',')[0]}
                        </p>
                        {shipment.destination.country && (
                          <p className="text-xs text-muted-foreground">
                            {shipment.destination.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ShipmentStatusBadge status={shipment.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(shipment.estimatedPickupDate)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`${baseUrl}/${shipment._id}`}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default ShipmentsTable;
