'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '@/lib/api';
import type {
  GetUsersParams,
  UpdateDriverStatusRequest,
  UpdateDriverLocationRequest,
  DriverCheckInRequest,
} from '@/types/api';
import { toast } from 'sonner';

export const driverKeys = {
  all: ['drivers'] as const,
  lists: () => [...driverKeys.all, 'list'] as const,
  list: (params?: GetUsersParams) => [...driverKeys.lists(), params] as const,
  details: () => [...driverKeys.all, 'detail'] as const,
  detail: (id: string) => [...driverKeys.details(), id] as const,
  assignedShipments: (id: string) => [...driverKeys.detail(id), 'shipments'] as const,
  dashboard: () => [...driverKeys.all, 'dashboard'] as const,
  myShipments: (params?: Record<string, unknown>) => [...driverKeys.all, 'my-shipments', params] as const,
};

export function useDrivers(params?: GetUsersParams) {
  return useQuery({
    queryKey: driverKeys.list(params),
    queryFn: () => driversApi.list(params),
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: driverKeys.detail(id),
    queryFn: () => driversApi.get(id),
    enabled: !!id,
  });
}

export function useDriverAssignedShipments(id: string) {
  return useQuery({
    queryKey: driverKeys.assignedShipments(id),
    queryFn: () => driversApi.getAssignedShipments(id),
    enabled: !!id,
  });
}

export function useUpdateDriverStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDriverStatusRequest }) =>
      driversApi.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: driverKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      toast.success('تم تحديث حالة السائق');
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث حالة السائق', { description: error.message });
    },
  });
}

export function useUpdateDriverLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDriverLocationRequest }) =>
      driversApi.updateLocation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: driverKeys.detail(id) });
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث الموقع', { description: error.message });
    },
  });
}

export function useDriverCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DriverCheckInRequest }) =>
      driversApi.checkIn(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: driverKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      toast.success('تم تسجيل الحضور بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تسجيل الحضور', { description: error.message });
    },
  });
}

export function useDriverCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => driversApi.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      toast.success('تم تسجيل الانصراف بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تسجيل الانصراف', { description: error.message });
    },
  });
}

// Hook for driver dashboard data (current driver's view)
export function useDriverDashboard() {
  return useQuery({
    queryKey: driverKeys.dashboard(),
    queryFn: async () => {
      // This would call a driver dashboard endpoint
      // For now returning mock data structure
      return {
        stats: {
          completedDeliveries: 0,
          activeDeliveries: 0,
          totalDistance: 0,
          rating: 0,
        },
        currentShipment: null,
        assignedTruck: null,
        upcomingDeliveries: [],
        alerts: [],
      } as {
        stats: {
          completedDeliveries: number;
          activeDeliveries: number;
          totalDistance: number;
          rating: number;
        };
        currentShipment: import('@/types/entities').Shipment | null;
        assignedTruck: import('@/types/entities').Truck | null;
        upcomingDeliveries: import('@/types/entities').Shipment[];
        alerts: string[];
      };
    },
  });
}

// Parameters for driver shipments query
export type DriverShipmentsParams = {
  page?: number;
  limit?: number;
  shipmentStatus?: string;
  [key: string]: unknown;
};

// Hook for driver's own shipments
export function useDriverShipments(params?: DriverShipmentsParams) {
  return useQuery({
    queryKey: driverKeys.myShipments(params),
    queryFn: async () => {
      // This would call a driver shipments endpoint
      // For now returning mock data structure
      return {
        data: [] as import('@/types/entities').Shipment[],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      };
    },
  });
}

export default useDrivers;
