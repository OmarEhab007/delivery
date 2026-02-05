'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi, truckOwnerApi } from '@/lib/api';
import type {
  GetUsersParams,
  UpdateDriverStatusRequest,
  UpdateDriverLocationRequest,
  DriverCheckInRequest,
  DriverCheckOutRequest,
  DriverIssueRequest,
  DriverStartDeliveryRequest,
  DriverCompleteDeliveryRequest,
} from '@/types/api';
import { toast } from 'sonner';
import type { Shipment, User } from '@/types/entities';

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
    queryFn: async () => {
      const response = await truckOwnerApi.getDrivers(params as Record<string, string | number | boolean | undefined>);
      const drivers = response.data?.drivers || [];
      return {
        success: true,
        data: drivers,
        pagination: {
          page: 1,
          limit: drivers.length,
          total: response.data?.count || drivers.length,
          totalPages: 1,
        },
      };
    },
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: driverKeys.detail(id),
    queryFn: async () => {
      const response = await truckOwnerApi.getDrivers();
      const driver = response.data?.drivers.find((item) => item._id === id);
      return { success: true, data: driver } as { success: true; data: User | undefined };
    },
    enabled: !!id,
  });
}

export function useDriverAssignedShipments(id: string) {
  return useQuery({
    queryKey: driverKeys.assignedShipments(id),
    queryFn: async () => {
      const response = await truckOwnerApi.getShipments();
      const shipments = response.data?.shipments || [];
      const assigned = shipments.filter((shipment) => {
        const assignedDriver = (shipment as Shipment).assignedDriver;
        const assignedDriverId = (shipment as Shipment).assignedDriverId;
        return (
          assignedDriver?._id === id ||
          assignedDriverId === id ||
          (typeof assignedDriverId === 'object' && (assignedDriverId as { _id?: string })._id === id)
        );
      });
      return { success: true, data: assigned } as { success: true; data: Shipment[] };
    },
    enabled: !!id,
  });
}

export function useUpdateDriverStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDriverStatusRequest) => driversApi.updateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.dashboard() });
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
    mutationFn: (data: UpdateDriverLocationRequest) => driversApi.updateLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث الموقع', { description: error.message });
    },
  });
}

export function useDriverCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DriverCheckInRequest) => driversApi.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.dashboard() });
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
    mutationFn: (data: DriverCheckOutRequest) => driversApi.checkOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.dashboard() });
      toast.success('تم تسجيل الانصراف بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تسجيل الانصراف', { description: error.message });
    },
  });
}

export function useDriverStartDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipmentId, data }: { shipmentId: string; data: DriverStartDeliveryRequest }) =>
      driversApi.startDelivery(shipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: driverKeys.myShipments() });
      toast.success('تم بدء التوصيل بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل بدء التوصيل', { description: error.message });
    },
  });
}

export function useDriverCompleteDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipmentId, data }: { shipmentId: string; data: DriverCompleteDeliveryRequest }) =>
      driversApi.completeDelivery(shipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: driverKeys.myShipments() });
      toast.success('تم إتمام التوصيل بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل إتمام التوصيل', { description: error.message });
    },
  });
}

export function useDriverReportIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipmentId, data }: { shipmentId: string; data: DriverIssueRequest }) =>
      driversApi.reportIssue(shipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.dashboard() });
      toast.success('تم إرسال التقرير بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل إرسال التقرير', { description: error.message });
    },
  });
}

export function useDriverUpdateShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipmentId, status, notes }: { shipmentId: string; status: Shipment['status']; notes?: string }) =>
      driversApi.updateShipmentStatus(shipmentId, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: driverKeys.myShipments() });
      toast.success('تم تحديث حالة الشحنة');
    },
    onError: (error: Error) => {
      toast.error('فشل تحديث حالة الشحنة', { description: error.message });
    },
  });
}

// Hook for driver dashboard data (current driver's view)
export function useDriverDashboard() {
  return useQuery({
    queryKey: driverKeys.dashboard(),
    queryFn: async () => {
      const response = await driversApi.getDashboard();
      const data = response.data;
      const activeShipments = data?.activeShipments || [];
      const nextDelivery = data?.nextDelivery || null;
      const upcomingDeliveries = activeShipments.filter((shipment) => shipment._id !== nextDelivery?._id);

      return {
        stats: {
          completedDeliveries: data?.metrics?.totalDeliveriesCompleted || 0,
          activeDeliveries: data?.metrics?.activeShipmentCount || activeShipments.length,
          totalDistance: 0,
          rating: null as number | null,
        },
        driver: data?.driver || null,
        currentShipment: nextDelivery,
        assignedTruck: data?.truck || null,
        upcomingDeliveries,
        alerts: (data?.openIssues || []).map((issue) => `مشكلة مفتوحة للشحنة #${issue._id?.slice?.(-8) || ''}`),
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
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const status = params?.shipmentStatus;

      const isHistory = status === 'DELIVERED' || status === 'COMPLETED';
      const response = isHistory
        ? await driversApi.getShipmentHistory()
        : await driversApi.getAssignedShipments();

      const shipments = response.data?.shipments || [];
      const filtered = status ? shipments.filter((shipment) => shipment.status === status) : shipments;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return {
        data: paged,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.max(1, Math.ceil(filtered.length / limit)),
        },
      };
    },
  });
}

export default useDrivers;
