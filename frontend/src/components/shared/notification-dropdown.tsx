'use client';

import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Eye, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';
import type { PersistentNotification } from '@/types/entities';

interface NotificationDropdownProps {
  trigger: React.ReactNode;
}

export function NotificationDropdown({ trigger }: NotificationDropdownProps) {
  const router = useRouter();
  const {
    persistentNotifications,
    markAsRead,
    markAllAsRead,
    removePersistentNotification,
  } = useNotificationStore();

  // Get the 10 most recent notifications
  const recentNotifications = persistentNotifications.slice(0, 10);
  const hasUnread = recentNotifications.some((n) => !n.read);

  const handleNotificationClick = (notification: PersistentNotification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleViewAll = () => {
    router.push('/notifications');
  };

  const getNotificationIcon = () => {
    // You can customize icons based on notification type
    return '🔔';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 rounded-2xl border-border/70 bg-background/95 p-0 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-sm font-semibold">الإشعارات</h3>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="ml-1 h-3 w-3" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        <Separator />

        {/* Notifications list */}
        {recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">لا توجد إشعارات</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-2">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'group relative cursor-pointer rounded-lg p-3 transition-colors hover:bg-accent',
                    !notification.read && 'bg-accent/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg" aria-hidden="true">
                      {getNotificationIcon()}
                    </span>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-tight',
                          !notification.read && 'font-semibold'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    )}
                  </div>

                  {/* Delete button (shown on hover) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePersistentNotification(notification.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={handleViewAll}
              >
                <Eye className="ml-2 h-4 w-4" />
                عرض جميع الإشعارات
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationDropdown;
