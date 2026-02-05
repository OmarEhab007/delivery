/**
 * Notification Store - Zustand store for notifications/toasts and persistent notifications
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PersistentNotification } from '@/types/entities';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

interface NotificationState {
  // Toast notifications (temporary)
  notifications: Notification[];

  // Persistent notifications (stored in localStorage)
  persistentNotifications: PersistentNotification[];

  // Computed unread count
  unreadCount: () => number;

  // Toast actions
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Persistent notification actions
  addPersistentNotification: (notification: Omit<PersistentNotification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removePersistentNotification: (id: string) => void;
  clearAllPersistent: () => void;

  // Convenience methods for toasts
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

function generateId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MAX_PERSISTENT_NOTIFICATIONS = 100;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      persistentNotifications: [],

      unreadCount: () => {
        return get().persistentNotifications.filter((n) => !n.read).length;
      },

      addNotification: (notification) => {
        const id = generateId();
        const newNotification: Notification = {
          id,
          duration: 5000,
          dismissible: true,
          ...notification,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      addPersistentNotification: (notification) => {
        const newNotification: PersistentNotification = {
          ...notification,
          id: generateId(),
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const updated = [newNotification, ...state.persistentNotifications];

          // Enforce max limit with oldest-first eviction
          if (updated.length > MAX_PERSISTENT_NOTIFICATIONS) {
            return {
              persistentNotifications: updated.slice(0, MAX_PERSISTENT_NOTIFICATIONS),
            };
          }

          return { persistentNotifications: updated };
        });
      },

      markAsRead: (id) => {
        set((state) => ({
          persistentNotifications: state.persistentNotifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          persistentNotifications: state.persistentNotifications.map((n) => ({
            ...n,
            read: true,
          })),
        }));
      },

      removePersistentNotification: (id) => {
        set((state) => ({
          persistentNotifications: state.persistentNotifications.filter((n) => n.id !== id),
        }));
      },

      clearAllPersistent: () => {
        set({ persistentNotifications: [] });
      },

      success: (title, message) => {
        return get().addNotification({ type: 'success', title, message });
      },

      error: (title, message) => {
        return get().addNotification({ type: 'error', title, message, duration: 8000 });
      },

      warning: (title, message) => {
        return get().addNotification({ type: 'warning', title, message });
      },

      info: (title, message) => {
        return get().addNotification({ type: 'info', title, message });
      },
    }),
    {
      name: 'persistent-notifications',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        persistentNotifications: state.persistentNotifications,
      }),
    }
  )
);

export default useNotificationStore;
