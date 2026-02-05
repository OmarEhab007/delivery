'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Webhook } from 'lucide-react';
import type { WebhookSubscription } from '@/types/entities';

interface WebhooksTableProps {
  webhooks: WebhookSubscription[];
  isLoading?: boolean;
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

const eventTypeLabels: Record<string, string> = {
  SHIPMENT_CREATED: 'إنشاء شحنة',
  SHIPMENT_STATUS_UPDATED: 'تحديث حالة',
  SHIPMENT_DELIVERED: 'تم التسليم',
  APPLICATION_SUBMITTED: 'تقديم عرض',
  APPLICATION_APPROVED: 'قبول عرض',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default',
  PAUSED: 'secondary',
  DISABLED: 'destructive',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  PAUSED: 'متوقف مؤقتاً',
  DISABLED: 'معطل',
};

export function WebhooksTable({
  webhooks,
  isLoading = false,
}: WebhooksTableProps) {
  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.slice(0, maxLength) + '...';
  };

  return (
    <div className="rounded-xl border bg-card/60 shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
          <TableRow>
            <TableHead>رابط الـ Endpoint</TableHead>
            <TableHead>أنواع الأحداث</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>الفشل</TableHead>
            <TableHead>آخر تسليم</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : webhooks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="border-0">
                <EmptyState
                  icon={Webhook}
                  title="لا توجد webhooks"
                  description="لم يتم إضافة أي webhooks بعد. قم بإضافة webhook جديد لاستقبال الإشعارات"
                />
              </TableCell>
            </TableRow>
          ) : (
            webhooks.map((webhook) => (
              <TableRow key={webhook._id}>
                <TableCell className="font-mono text-xs">
                  <span title={webhook.endpointUrl}>
                    {truncateUrl(webhook.endpointUrl)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {webhook.eventTypes.map((eventType) => (
                      <Badge key={eventType} variant="outline" className="text-xs">
                        {eventTypeLabels[eventType] || eventType}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[webhook.status] || 'default'}>
                    {statusLabels[webhook.status] || webhook.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {webhook.failureCount > 0 ? (
                    <span className="text-destructive font-medium">
                      {webhook.failureCount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(webhook.lastDeliveredAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default WebhooksTable;
