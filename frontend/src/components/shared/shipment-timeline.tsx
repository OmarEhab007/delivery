'use client';

import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Truck,
  Package,
  MapPin,
  FileText,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimelineEntry } from '@/types/entities';

interface ShipmentTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

const statusIcons: Record<string, React.ElementType> = {
  PENDING_APPROVAL: Clock,
  REQUESTED: FileText,
  CONFIRMED: CheckCircle2,
  ASSIGNED: User,
  LOADING: Package,
  IN_TRANSIT: Truck,
  UNLOADING: Package,
  AT_BORDER: MapPin,
  DELIVERED: CheckCircle2,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  DELAYED: AlertTriangle,
  REJECTED: XCircle,
  ISSUE_REPORTED: AlertTriangle,
};

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'في انتظار الموافقة',
  REQUESTED: 'تم الطلب',
  CONFIRMED: 'تم التأكيد',
  ASSIGNED: 'تم التعيين',
  LOADING: 'جاري التحميل',
  IN_TRANSIT: 'في الطريق',
  UNLOADING: 'جاري التفريغ',
  AT_BORDER: 'عند الحدود',
  DELIVERED: 'تم التسليم',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
  DELAYED: 'متأخرة',
  REJECTED: 'مرفوضة',
  ISSUE_REPORTED: 'تم الإبلاغ عن مشكلة',
};

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-500',
  REQUESTED: 'bg-blue-400',
  CONFIRMED: 'bg-blue-500',
  ASSIGNED: 'bg-indigo-500',
  LOADING: 'bg-purple-500',
  IN_TRANSIT: 'bg-primary',
  UNLOADING: 'bg-teal-500',
  AT_BORDER: 'bg-orange-500',
  DELIVERED: 'bg-green-500',
  COMPLETED: 'bg-green-600',
  CANCELLED: 'bg-red-500',
  DELAYED: 'bg-red-400',
  REJECTED: 'bg-red-500',
  ISSUE_REPORTED: 'bg-yellow-600',
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function ShipmentTimeline({ entries, className }: ShipmentTimelineProps) {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">سجل الحالات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute right-4 top-0 bottom-0 w-px bg-border" />

          {sortedEntries.map((entry) => {
            const Icon = statusIcons[entry.status] || Clock;
            const color = statusColors[entry.status] || 'bg-gray-500';
            const label = statusLabels[entry.status] || entry.status;

            return (
              <div key={entry._id} className="relative flex gap-4 pb-6">
                {/* Icon circle */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white',
                    color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{label}</h4>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </time>
                  </div>

                  {entry.note && (
                    <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
                  )}

                  {entry.location && entry.location.address && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{entry.location.address}</span>
                    </div>
                  )}

                  {entry.documents && entry.documents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.documents.map((doc) => (
                        <div
                          key={doc.documentId}
                          className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                        >
                          <FileText className="h-3 w-3" />
                          <span>{doc.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sortedEntries.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              لا توجد تحديثات بعد
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ShipmentTimeline;
