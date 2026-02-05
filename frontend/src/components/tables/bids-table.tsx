'use client';

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
import { ApplicationStatusBadge } from '@/components/shared/status-badge';
import { CheckCircle2, XCircle, Truck, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Application } from '@/types/entities';

interface BidsTableProps {
  applications: Application[];
  isLoading?: boolean;
  onAccept?: (application: Application) => void;
  onReject?: (application: Application) => void;
  canManage?: boolean;
  emptyMessage?: string;
}

function formatCurrency(amount: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `منذ ${days} يوم`;
  if (hours > 0) return `منذ ${hours} ساعة`;
  if (minutes > 0) return `منذ ${minutes} دقيقة`;
  return 'الآن';
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function BidsTable({
  applications,
  isLoading = false,
  onAccept,
  onReject,
  canManage = true,
  emptyMessage = 'لا توجد عروض',
}: BidsTableProps) {
  // Sort by price ascending (best price first)
  const sortedApplications = [...applications].sort(
    (a, b) => a.bidDetails.price - b.bidDetails.price
  );

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>مقدم العرض</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>الشاحنة</TableHead>
            <TableHead>السائق</TableHead>
            <TableHead>الحالة</TableHead>
            {canManage && <TableHead className="text-center">إجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : sortedApplications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedApplications.map((application, index) => {
              const isPending = application.status === 'PENDING';
              const isBestPrice = index === 0 && isPending;

              return (
                <TableRow key={application._id} className={cn(isBestPrice && 'bg-green-50/50')}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{application.owner?.name || '--'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(application.createdAt)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-semibold',
                        isBestPrice && 'text-green-600'
                      )}>
                        {formatCurrency(application.bidDetails.price, application.bidDetails.currency)}
                      </span>
                      {isBestPrice && (
                        <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                          أفضل سعر
                        </span>
                      )}
                    </div>
                    {application.bidDetails.validUntil && (
                      <p className="text-xs text-muted-foreground">
                        صالح حتى {formatDate(application.bidDetails.validUntil)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {application.assignedTruck?.model || '--'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {application.assignedTruck?.plateNumber}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{application.driver?.name || '--'}</p>
                  </TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={application.status} />
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
                            onClick={() => onAccept?.(application)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="sr-only">قبول</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                            onClick={() => onReject?.(application)}
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="sr-only">رفض</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-center text-xs text-muted-foreground">--</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Notes section if any application has notes */}
      {sortedApplications.some((app) => app.bidDetails.notes) && (
        <div className="border-t p-4 space-y-3">
          <h4 className="text-sm font-medium">ملاحظات العروض</h4>
          {sortedApplications
            .filter((app) => app.bidDetails.notes)
            .map((app) => (
              <div key={app._id} className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {app.owner?.name || 'مقدم العرض'}:
                </p>
                <p className="text-sm">{app.bidDetails.notes}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default BidsTable;
