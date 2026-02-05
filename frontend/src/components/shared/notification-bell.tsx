'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const { unreadCount } = useNotificationStore();
  const count = unreadCount();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative rounded-full', className)}
      onClick={onClick}
      aria-label={count > 0 ? `الإشعارات (${count} غير مقروءة)` : 'الإشعارات'}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
}

export default NotificationBell;
