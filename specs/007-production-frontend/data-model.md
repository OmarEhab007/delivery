# Data Model: Production Frontend Completion

**Feature Branch**: `007-production-frontend`
**Date**: 2026-02-05

## Overview

This document describes the frontend-specific data types and state shapes introduced by this feature. All data originates from the backend API; this document defines the TypeScript types used in the frontend to consume, display, and manage that data.

---

## New Entity Types

### Notification (Client-Side Persistent)

```typescript
interface PersistentNotification {
  id: string;                          // Generated UUID
  type: NotificationEventType;         // Event type from backend
  title: string;                       // Display title
  message: string;                     // Display message
  read: boolean;                       // Read/unread state
  createdAt: string;                   // ISO 8601 timestamp
  entityType?: 'shipment' | 'application' | 'truck' | 'user';
  entityId?: string;                   // Link to related entity
  link?: string;                       // Navigation link
}

type NotificationEventType =
  | 'SHIPMENT_CREATED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'SHIPMENT_STATUS_UPDATED'
  | 'SHIPMENT_DELIVERED'
  | 'PAYMENT_UPLOADED'
  | 'FIXED_PRICE_SHIPMENT_AVAILABLE'
  | 'FIXED_PRICE_SHIPMENT_ACCEPTED'
  | 'ASSIGNED_TO_SHIPMENT'
  | 'SHIPMENT_DELAY_ALERT'
  | 'SHIPMENT_MISSING_UPDATE';
```

**State management**: Zustand store with `persist` middleware (localStorage). Max 100 notifications, oldest evicted first.

### Broker (from Backend)

```typescript
interface Broker {
  _id: string;
  name: string;
  licenseNumber: string;
  countriesServed: string[];
  contacts: {
    email?: string;
    phone?: string;
  };
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### AutomationRule (from Backend)

```typescript
interface AutomationRule {
  _id: string;
  merchantId: string;
  createdBy: string;
  name: string;
  triggerType: 'delay' | 'missing-update';
  threshold: number;
  thresholdUnit: 'hours';
  action: 'notify' | 'escalate';
  active: boolean;
  lastTriggeredAt?: string;
  lastTriggeredShipmentId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### IntegrationCredential (from Backend)

```typescript
interface IntegrationCredential {
  _id: string;
  name: string;
  apiKeyPrefix: string;              // First 12 chars for display
  scopes: Array<'shipments:read' | 'shipments:write' | 'webhooks:read' | 'webhooks:write'>;
  merchantId: string;
  active: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Response when creating (includes full key once)
interface CreateCredentialResponse {
  credential: IntegrationCredential;
  apiKey: string;                     // Full key, shown only once
}
```

### WebhookSubscription (from Backend)

```typescript
interface WebhookSubscription {
  _id: string;
  merchantId: string;
  endpointUrl: string;
  eventTypes: string[];
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  lastDeliveredAt?: string;
  failureCount: number;
  lastFailureAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Analytics Response Types

### KPI Summary

```typescript
interface KpiResponse {
  success: true;
  data: {
    summary: {
      totalShipments: number;
      deliveredCount: number;
      onTimeRate: number;            // 0-1 decimal
      averageTransitHours: number;
      averageDelayHours: number;
    };
  };
}
```

### Status Trends

```typescript
interface StatusTrendsResponse {
  success: true;
  data: Array<{
    period: string;                  // "2024-01" format
    statuses: Record<string, number>; // status name → count
  }>;
}
```

### Revenue Analysis

```typescript
interface RevenueResponse {
  success: true;
  data: Array<{
    period: string;
    totalRevenue: number;
    shipmentCount: number;
    averageRevenuePerShipment: number;
  }>;
}
```

### Performance Metrics

```typescript
interface PerformanceResponse {
  success: true;
  data: Array<{
    _id: string;
    driverName?: string;
    driverEmail?: string;
    totalShipments: number;
    totalDistance: number;
    averageRating: number;
    onTimeDeliveryRate: number;
  }>;
}
```

### Customer Insights

```typescript
interface CustomerInsightsResponse {
  success: true;
  data: Array<{
    _id: string;
    merchantName: string;
    merchantEmail: string;
    totalShipments: number;
    totalRevenue: number;
    avgOrderValue: number;
    firstOrderDate: string;
    lastOrderDate: string;
    daysSinceFirstOrder: number;
    daysSinceLastOrder: number;
  }>;
}
```

### Operational Efficiency

```typescript
interface EfficiencyResponse {
  success: true;
  data: Array<{
    period: string;
    totalShipments: number;
    completedShipments: number;
    cancelledShipments: number;
    delayedShipments: number;
    completionRate: number;
    cancellationRate: number;
    delayRate: number;
    avgDeliveryTime: number;
  }>;
}
```

### Geographic Distribution

```typescript
interface GeoResponse {
  success: true;
  data: Array<{
    origin: string;
    destination: string;
    shipmentCount: number;
    totalRevenue: number;
    averageTravelTime: number;
  }>;
}

interface GeoHotspotsResponse {
  success: true;
  data: Array<{
    originHotspots: Array<{ _id: string; count: number }>;
    destinationHotspots: Array<{ _id: string; count: number }>;
  }>;
}
```

---

## Enhanced Notification Store Shape

```typescript
interface PersistentNotificationState {
  notifications: PersistentNotification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<PersistentNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}
```

---

## URL Filter State Shape

```typescript
interface FilterState {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;  // Entity-specific filters
}
```

---

## Relationships

```
PersistentNotification → Shipment (entityId when entityType='shipment')
PersistentNotification → Application (entityId when entityType='application')
Broker → Shipment (via compliance.brokerId on shipment)
AutomationRule → Merchant (via merchantId)
IntegrationCredential → Merchant (via merchantId)
WebhookSubscription → Merchant (via merchantId)
```
