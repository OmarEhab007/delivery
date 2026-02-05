'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { truckOwnerApi } from '@/lib/api';
import { toast } from 'sonner';

export const truckOwnerKeys = {
  shipments: (params?: Record<string, unknown>) => ['truck-owner', 'shipments', params] as const,
  availableShipments: (params?: Record<string, unknown>) => ['truck-owner', 'shipments-available', params] as const,
};

export function useTruckOwnerShipments(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: truckOwnerKeys.shipments(params),
    queryFn: () => truckOwnerApi.getShipments(params),
  });
}

export function useTruckOwnerAvailableShipments(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: truckOwnerKeys.availableShipments(params),
    queryFn: () => truckOwnerApi.getAvailableShipments(params),
  });
}

export function useTruckOwnerAssignShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipmentId, driverId }: { shipmentId: string; driverId: string }) =>
      truckOwnerApi.assignShipment(shipmentId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: truckOwnerKeys.shipments() });
      toast.success('تم تعيين الشحنة للسائق');
    },
    onError: (error: Error) => {
      toast.error('فشل في تعيين الشحنة', { description: error.message });
    },
  });
}

export default useTruckOwnerShipments;
