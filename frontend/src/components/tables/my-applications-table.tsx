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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationStatusBadge } from '@/components/shared/status-badge';
import {
  Eye,
  Edit,
  XCircle,
  ChevronRight,
  ChevronLeft,
  MapPin,
  DollarSign,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { Application } from '@/types/entities';
import type { ApplicationStatus } from '@/types/api';

interface MyApplicationsTableProps {
  applications: Application[];
  isLoading?: boolean;
  onStatusFilter?: (status: ApplicationStatus | 'all') => void;
  onEdit?: (application: Application) => void;
  onCancel?: (application: Application) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

function formatCurrency(amount: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (days > 0) return `منذ ${days} يوم`;
  if (hours > 0) return `منذ ${hours} ساعة`;
  return 'الآن';
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

const statusOptions: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'PENDING', label: 'قيد المراجعة' },
  { value: 'ACCEPTED', label: 'مقبولة' },
  { value: 'REJECTED', label: 'مرفوضة' },
  { value: 'CANCELLED', label: 'ملغاة' },
];

export function MyApplicationsTable({
  applications,
  isLoading = false,
  onStatusFilter,
  onEdit,
  onCancel,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = 'لا توجد عروض',
}: MyApplicationsTableProps) {
  return (
    <div className="space-y-4">
      {/* Filter */}
      {onStatusFilter && (
        <div className="flex items-center gap-4">
          <Select
            defaultValue="all"
            onValueChange={(value) => onStatusFilter(value as ApplicationStatus | 'all')}
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
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الشحنة</TableHead>
              <TableHead>السعر المقترح</TableHead>
              <TableHead>الشاحنة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              applications.map((application) => {
                const canEdit = application.status === 'PENDING';
                const canCancel = application.status === 'PENDING';

                return (
                  <TableRow key={application._id}>
                    <TableCell>
                      <div className="space-y-1">
                        {application.shipment ? (
                          <>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-green-500" />
                              <span className="text-sm font-medium truncate max-w-[150px]">
                                {application.shipment.origin.address.split(',')[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {application.shipment.destination.address.split(',')[0]}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="font-mono text-xs">
                            #{application.shipmentId.slice(-8)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          {formatCurrency(
                            application.bidDetails.price,
                            application.bidDetails.currency
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.assignedTruck ? (
                        <div className="text-sm">
                          <p className="font-medium">{application.assignedTruck.model}</p>
                          <p className="text-xs text-muted-foreground">
                            {application.assignedTruck.plateNumber}
                          </p>
                        </div>
                      ) : (
                        '--'
                      )}
                    </TableCell>
                    <TableCell>
                      <ApplicationStatusBadge status={application.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(application.createdAt)}
                      </div>
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
                            <Link href={`/truck-owner/applications/${application._id}`}>
                              <Eye className="ml-2 h-4 w-4" />
                              عرض التفاصيل
                            </Link>
                          </DropdownMenuItem>
                          {canEdit && onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(application)}>
                              <Edit className="ml-2 h-4 w-4" />
                              تعديل العرض
                            </DropdownMenuItem>
                          )}
                          {canCancel && onCancel && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onCancel(application)}
                                className="text-destructive"
                              >
                                <XCircle className="ml-2 h-4 w-4" />
                                إلغاء العرض
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
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

export default MyApplicationsTable;
