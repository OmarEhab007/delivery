/**
 * Unit tests for notification store
 */

import { useNotificationStore } from '@/stores/notification-store';
import type { PersistentNotification } from '@/types/entities';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('notification store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNotificationStore.setState({
      notifications: [],
      persistentNotifications: [],
    });
    localStorageMock.clear();
  });

  describe('addPersistentNotification', () => {
    it('should add a persistent notification', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'New Shipment',
        message: 'A new shipment has been created',
        read: false,
      });

      const state = useNotificationStore.getState();
      expect(state.persistentNotifications).toHaveLength(1);
      expect(state.persistentNotifications[0]).toMatchObject({
        type: 'SHIPMENT_CREATED',
        title: 'New Shipment',
        message: 'A new shipment has been created',
        read: false,
      });
      expect(state.persistentNotifications[0].id).toBeDefined();
      expect(state.persistentNotifications[0].createdAt).toBeDefined();
    });

    it('should add notifications to the beginning of the array', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'First',
        message: 'First notification',
        read: false,
      });

      store.addPersistentNotification({
        type: 'APPLICATION_SUBMITTED',
        title: 'Second',
        message: 'Second notification',
        read: false,
      });

      const state = useNotificationStore.getState();
      expect(state.persistentNotifications).toHaveLength(2);
      expect(state.persistentNotifications[0].title).toBe('Second');
      expect(state.persistentNotifications[1].title).toBe('First');
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'Test',
        message: 'Test message',
        read: false,
      });

      const state = useNotificationStore.getState();
      const notificationId = state.persistentNotifications[0].id;

      store.markAsRead(notificationId);

      const updatedState = useNotificationStore.getState();
      expect(updatedState.persistentNotifications[0].read).toBe(true);
    });

    it('should only mark the specified notification as read', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'First',
        message: 'First',
        read: false,
      });

      store.addPersistentNotification({
        type: 'APPLICATION_SUBMITTED',
        title: 'Second',
        message: 'Second',
        read: false,
      });

      const state = useNotificationStore.getState();
      const firstId = state.persistentNotifications[0].id;

      store.markAsRead(firstId);

      const updatedState = useNotificationStore.getState();
      expect(updatedState.persistentNotifications[0].read).toBe(true);
      expect(updatedState.persistentNotifications[1].read).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'First',
        message: 'First',
        read: false,
      });

      store.addPersistentNotification({
        type: 'APPLICATION_SUBMITTED',
        title: 'Second',
        message: 'Second',
        read: false,
      });

      store.addPersistentNotification({
        type: 'SHIPMENT_DELIVERED',
        title: 'Third',
        message: 'Third',
        read: false,
      });

      store.markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.persistentNotifications.every((n) => n.read)).toBe(true);
    });

    it('should work with empty notification list', () => {
      const store = useNotificationStore.getState();

      expect(() => store.markAllAsRead()).not.toThrow();

      const state = useNotificationStore.getState();
      expect(state.persistentNotifications).toHaveLength(0);
    });
  });

  describe('removePersistentNotification', () => {
    it('should remove a notification by id', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'Test',
        message: 'Test message',
        read: false,
      });

      const state = useNotificationStore.getState();
      const notificationId = state.persistentNotifications[0].id;

      store.removePersistentNotification(notificationId);

      const updatedState = useNotificationStore.getState();
      expect(updatedState.persistentNotifications).toHaveLength(0);
    });

    it('should only remove the specified notification', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'First',
        message: 'First',
        read: false,
      });

      store.addPersistentNotification({
        type: 'APPLICATION_SUBMITTED',
        title: 'Second',
        message: 'Second',
        read: false,
      });

      const state = useNotificationStore.getState();
      const firstId = state.persistentNotifications[0].id;

      store.removePersistentNotification(firstId);

      const updatedState = useNotificationStore.getState();
      expect(updatedState.persistentNotifications).toHaveLength(1);
      expect(updatedState.persistentNotifications[0].title).toBe('First');
    });
  });

  describe('max notifications limit', () => {
    it('should enforce max 100 notifications with eviction of oldest', () => {
      const store = useNotificationStore.getState();

      // Add 102 notifications
      for (let i = 1; i <= 102; i++) {
        store.addPersistentNotification({
          type: 'SHIPMENT_CREATED',
          title: `Notification ${i}`,
          message: `Message ${i}`,
          read: false,
        });
      }

      const state = useNotificationStore.getState();

      // Should have exactly 100 notifications
      expect(state.persistentNotifications).toHaveLength(100);

      // Newest notifications should be kept (102 and 101 are first)
      expect(state.persistentNotifications[0].title).toBe('Notification 102');
      expect(state.persistentNotifications[1].title).toBe('Notification 101');

      // Oldest notifications should be evicted (1 and 2 should not exist)
      const titles = state.persistentNotifications.map((n) => n.title);
      expect(titles).not.toContain('Notification 1');
      expect(titles).not.toContain('Notification 2');

      // Notification 3 should be the last one
      expect(state.persistentNotifications[99].title).toBe('Notification 3');
    });

    it('should not evict if under limit', () => {
      const store = useNotificationStore.getState();

      // Add 50 notifications
      for (let i = 1; i <= 50; i++) {
        store.addPersistentNotification({
          type: 'SHIPMENT_CREATED',
          title: `Notification ${i}`,
          message: `Message ${i}`,
          read: false,
        });
      }

      const state = useNotificationStore.getState();

      expect(state.persistentNotifications).toHaveLength(50);

      // All notifications should be present
      const titles = state.persistentNotifications.map((n) => n.title);
      expect(titles).toContain('Notification 1');
      expect(titles).toContain('Notification 50');
    });
  });

  describe('unreadCount', () => {
    it('should return the count of unread notifications', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'First',
        message: 'First',
        read: false,
      });

      store.addPersistentNotification({
        type: 'APPLICATION_SUBMITTED',
        title: 'Second',
        message: 'Second',
        read: false,
      });

      store.addPersistentNotification({
        type: 'SHIPMENT_DELIVERED',
        title: 'Third',
        message: 'Third',
        read: false,
      });

      expect(store.unreadCount()).toBe(3);

      // Mark one as read
      const state = useNotificationStore.getState();
      store.markAsRead(state.persistentNotifications[0].id);

      expect(store.unreadCount()).toBe(2);
    });

    it('should return 0 when no notifications exist', () => {
      const store = useNotificationStore.getState();

      expect(store.unreadCount()).toBe(0);
    });

    it('should return 0 when all notifications are read', () => {
      const store = useNotificationStore.getState();

      store.addPersistentNotification({
        type: 'SHIPMENT_CREATED',
        title: 'First',
        message: 'First',
        read: false,
      });

      store.markAllAsRead();

      expect(store.unreadCount()).toBe(0);
    });
  });
});
