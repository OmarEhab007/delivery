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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Truck as TruckIcon,
  User,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { Truck } from '@/types/entities';
import type { TruckStatus } from '@/types/api';

interface TrucksTableProps {
  trucks: Truck[];
  isLoading?: boolean;
  onEdit?: (truck: Truck) => void;
  onDelete?: (truck: Truck) => void;
  onAssignDriver?: (truck: Truck) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

function getStatusBadge(status: TruckStatus, available: boolean) {
  if (!available) {
    return <Badge variant="secondary">غير متاح</Badge>;
  }

  const statusConfig: Record<TruckStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    AVAILABLE: { label: 'متاح', variant: 'default' },
    IN_SERVICE: { label: 'في الخدمة', variant: 'secondary' },
    IN_MAINTENANCE: { label: 'صيانة', variant: 'outline' },
    OUT_OF_SERVICE: { label: 'خارج الخدمة', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function TrucksTable({
  trucks,
  isLoading = false,
  onEdit,
  onDelete,
  onAssignDriver,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: TrucksTableProps) {
  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-xl border bg-card/60 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
            <TableRow>
              <TableHead>رقم اللوحة</TableHead>
              <TableHead>الموديل</TableHead>
              <TableHead>السعة</TableHead>
              <TableHead>السائق</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الصيانة القادمة</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : trucks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="border-0">
                  <EmptyState
                    icon={TruckIcon}
                    title="لا توجد شاحنات"
                    description="لم يتم تسجيل أي شاحنات بعد. قم بإضافة شاحنة جديدة للبدء"
                  />
                </TableCell>
              </TableRow>
            ) : (
              trucks.map((truck) => (
                <TableRow key={truck._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TruckIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{truck.plateNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{truck.model}</p>
                      <p className="text-xs text-muted-foreground">{truck.year}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{truck.capacity} طن</span>
                  </TableCell>
                  <TableCell>
                    {truck.driver ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{truck.driver.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">غير معين</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(truck.status, truck.available)}
                  </TableCell>
                  <TableCell>
                    {truck.nextMaintenanceDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(truck.nextMaintenanceDate)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">--</span>
                    )}
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
                          <Link href={`/truck-owner/fleet/trucks/${truck._id}`}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </Link>
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(truck)}>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                        )}
                        {onAssignDriver && !truck.driverId && (
                          <DropdownMenuItem onClick={() => onAssignDriver(truck)}>
                            <User className="ml-2 h-4 w-4" />
                            تعيين سائق
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(truck)}
                              className="text-destructive"
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </>
                        )}
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

export default TrucksTable;
