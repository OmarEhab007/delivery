'use client';

import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Package,
  Truck,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'shipment' | 'user' | 'truck' | 'document' | 'application';
  action: string;
  user: string;
  time: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  details?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
  maxItems?: number;
  showEmpty?: boolean;
}

const activityIcons: Record<string, React.ElementType> = {
  shipment: Package,
  user: User,
  truck: Truck,
  document: FileText,
  application: FileText,
};

const statusIcons: Record<string, React.ElementType> = {
  success: CheckCircle2,
  warning: Clock,
  error: XCircle,
  info: MapPin,
};

const statusColors: Record<string, string> = {
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  info: 'text-blue-600',
};

export function ActivityFeed({
  activities,
  className,
  maxItems = 10,
  showEmpty = true,
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0 && showEmpty) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">لا توجد أنشطة حديثة</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {displayActivities.map((activity) => {
        const TypeIcon = activityIcons[activity.type] || Package;
        const StatusIcon = activity.status ? statusIcons[activity.status] : null;

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{activity.user}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(activity.time)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                {StatusIcon && (
                  <StatusIcon
                    className={cn('h-4 w-4', statusColors[activity.status || 'info'])}
                  />
                )}
                <p className="text-sm text-muted-foreground">{activity.action}</p>
              </div>

              {activity.details && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {activity.details}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch {
    return dateString;
  }
}

export default ActivityFeed;
