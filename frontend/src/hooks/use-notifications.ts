'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/lib/providers/socket-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import type { NotificationEventType, PersistentNotification } from '@/types/entities';
import type { UserRole } from '@/types/api';

interface NotificationPayload {
  type: NotificationEventType;
  title: string;
  message: string;
  entityType?: 'shipment' | 'application' | 'truck' | 'user';
  entityId?: string;
  recipientRole?: UserRole;
}

export function useNotificationSocket() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuthStore();
  const { addPersistentNotification } = useNotificationStore();

  const handleNotification = useCallback(
    (payload: NotificationPayload) => {
      // Filter by role if specified
      if (payload.recipientRole && user?.role !== payload.recipientRole) {
        return;
      }

      // Generate link based on entity type and user role
      let link: string | undefined;
      if (payload.entityType && payload.entityId) {
        switch (payload.entityType) {
          case 'shipment':
            if (user?.role === 'Merchant') {
              link = `/merchant/shipments/${payload.entityId}`;
            } else if (user?.role === 'TruckOwner') {
              link = `/truck-owner/applications?shipment=${payload.entityId}`;
            } else if (user?.role === 'Driver') {
              link = `/driver/shipments/${payload.entityId}`;
            } else if (user?.role === 'Admin') {
              link = `/admin/shipments/${payload.entityId}`;
            }
            break;
          case 'application':
            if (user?.role === 'Merchant') {
              link = `/merchant/applications/${payload.entityId}`;
            } else if (user?.role === 'TruckOwner') {
              link = `/truck-owner/applications/${payload.entityId}`;
            } else if (user?.role === 'Admin') {
              link = `/admin/applications/${payload.entityId}`;
            }
            break;
          case 'truck':
            if (user?.role === 'TruckOwner') {
              link = `/truck-owner/trucks/${payload.entityId}`;
            } else if (user?.role === 'Admin') {
              link = `/admin/trucks/${payload.entityId}`;
            }
            break;
          case 'user':
            if (user?.role === 'Admin') {
              link = `/admin/users/${payload.entityId}`;
            }
            break;
        }
      }

      // Add to persistent notification store
      const notification: Omit<PersistentNotification, 'id' | 'createdAt'> = {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        read: false,
        entityType: payload.entityType,
        entityId: payload.entityId,
        link,
      };

      addPersistentNotification(notification);
    },
    [user?.role, addPersistentNotification]
  );

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen to all notification event types
    const events: NotificationEventType[] = [
      'SHIPMENT_CREATED',
      'APPLICATION_SUBMITTED',
      'APPLICATION_APPROVED',
      'APPLICATION_REJECTED',
      'SHIPMENT_STATUS_UPDATED',
      'SHIPMENT_DELIVERED',
      'PAYMENT_UPLOADED',
      'FIXED_PRICE_SHIPMENT_AVAILABLE',
      'FIXED_PRICE_SHIPMENT_ACCEPTED',
      'ASSIGNED_TO_SHIPMENT',
      'SHIPMENT_DELAY_ALERT',
      'SHIPMENT_MISSING_UPDATE',
    ];

    // Generic notification handler
    const genericHandler = (payload: NotificationPayload) => {
      handleNotification(payload);
    };

    // Register all event listeners
    events.forEach((event) => {
      socket.on(`notification:${event.toLowerCase()}`, genericHandler);
    });

    // Also listen to a generic 'notification' event
    socket.on('notification', genericHandler);

    // Cleanup
    return () => {
      events.forEach((event) => {
        socket.off(`notification:${event.toLowerCase()}`, genericHandler);
      });
      socket.off('notification', genericHandler);
    };
  }, [socket, isConnected, handleNotification]);

  return {
    isConnected,
  };
}

export default useNotificationSocket;
