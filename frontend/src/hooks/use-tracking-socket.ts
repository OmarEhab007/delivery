'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/lib/providers/socket-provider';

export interface TrackingLocation {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface TrackingUpdate {
  shipmentId: string;
  driverId?: string;
  location: TrackingLocation;
  status?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseTrackingSocketOptions {
  shipmentId?: string;
  driverId?: string;
  autoConnect?: boolean;
  onLocationUpdate?: (update: TrackingUpdate) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: Error) => void;
}

interface UseTrackingSocketReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  currentLocation: TrackingLocation | null;
  locationHistory: TrackingLocation[];
  lastUpdate: Date | null;
  subscribeToShipment: (shipmentId: string) => void;
  unsubscribeFromShipment: (shipmentId: string) => void;
  sendLocation: (location: Omit<TrackingLocation, 'timestamp'>) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_LENGTH = 100;

export function useTrackingSocket({
  shipmentId,
  driverId,
  autoConnect = true,
  onLocationUpdate,
  onStatusChange,
  onError,
}: UseTrackingSocketOptions = {}): UseTrackingSocketReturn {
  const { socket, connectionStatus, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<TrackingLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<TrackingLocation[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const subscribedRoomsRef = useRef<Set<string>>(new Set());

  const subscribeToShipment = useCallback((id: string) => {
    if (socket?.connected && !subscribedRoomsRef.current.has(id)) {
      socket.emit('join:shipment', id);
      subscribedRoomsRef.current.add(id);
    }
  }, [socket]);

  const unsubscribeFromShipment = useCallback((id: string) => {
    if (socket?.connected && subscribedRoomsRef.current.has(id)) {
      socket.emit('leave:shipment', id);
      subscribedRoomsRef.current.delete(id);
    }
  }, [socket]);

  const sendLocation = useCallback((location: Omit<TrackingLocation, 'timestamp'>) => {
    if (!socket?.connected) return;

    const update: TrackingUpdate = {
      shipmentId: shipmentId || '',
      driverId: driverId || undefined,
      location: {
        ...location,
        timestamp: new Date().toISOString(),
      },
    };

    socket.emit('driver:location', update);
  }, [socket, shipmentId, driverId]);

  const clearHistory = useCallback(() => {
    setLocationHistory([]);
  }, []);

  // Subscribe to shipment room when connected
  useEffect(() => {
    if (isConnected && shipmentId && autoConnect) {
      subscribeToShipment(shipmentId);
    }

    return () => {
      if (shipmentId) {
        unsubscribeFromShipment(shipmentId);
      }
    };
  }, [isConnected, shipmentId, autoConnect, subscribeToShipment, unsubscribeFromShipment]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (update: TrackingUpdate) => {
      const { location } = update;

      setCurrentLocation(location);
      setLastUpdate(new Date());

      setLocationHistory((prev) => {
        const newHistory = [...prev, location];
        if (newHistory.length > MAX_HISTORY_LENGTH) {
          return newHistory.slice(-MAX_HISTORY_LENGTH);
        }
        return newHistory;
      });

      onLocationUpdate?.(update);
    };

    const handleStatusChange = (data: { shipmentId: string; status: string }) => {
      // Invalidate React Query cache so shipment data auto-refreshes
      queryClient.invalidateQueries({ queryKey: ['shipment', data.shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      onStatusChange?.(data.status);
    };

    const handleError = (error: Error) => {
      onError?.(error);
    };

    socket.on('shipment:location', handleLocationUpdate);
    socket.on('shipment:status', handleStatusChange);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('shipment:location', handleLocationUpdate);
      socket.off('shipment:status', handleStatusChange);
      socket.off('connect_error', handleError);
    };
  }, [socket, queryClient, onLocationUpdate, onStatusChange, onError]);

  return {
    isConnected,
    connectionStatus,
    currentLocation,
    locationHistory,
    lastUpdate,
    subscribeToShipment,
    unsubscribeFromShipment,
    sendLocation,
    clearHistory,
  };
}

// Hook for driver to send their location
export function useDriverLocationTracking(driverId: string, shipmentId?: string) {
  const tracking = useTrackingSocket({ driverId, shipmentId });
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        tracking.sendLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 3.6 : undefined,
          heading: position.coords.heading || undefined,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [tracking]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    ...tracking,
    startTracking,
    stopTracking,
    isTracking: watchIdRef.current !== null,
  };
}

export default useTrackingSocket;
