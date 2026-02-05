'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getTokens } from '@/lib/api/client';

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
  connect: () => void;
  disconnect: () => void;
  sendLocation: (location: Omit<TrackingLocation, 'timestamp'>) => void;
  clearHistory: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
const MAX_HISTORY_LENGTH = 100;

export function useTrackingSocket({
  shipmentId,
  driverId,
  autoConnect = true,
  onLocationUpdate,
  onStatusChange,
  onError,
}: UseTrackingSocketOptions = {}): UseTrackingSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [currentLocation, setCurrentLocation] = useState<TrackingLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<TrackingLocation[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const isConnected = connectionStatus === 'connected';

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setConnectionStatus('connecting');

    const { accessToken } = getTokens();

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: accessToken ? { token: accessToken } : undefined,
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');

      // Join shipment tracking room if shipmentId provided
      if (shipmentId) {
        socket.emit('join:shipment', shipmentId);
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      setConnectionStatus('error');
      onError?.(error);
    });

    // Listen for location updates
    socket.on('shipment:location', (update: TrackingUpdate) => {
      const { location } = update;

      setCurrentLocation(location);
      setLastUpdate(new Date());

      setLocationHistory((prev) => {
        const newHistory = [...prev, location];
        // Keep only the last MAX_HISTORY_LENGTH entries
        if (newHistory.length > MAX_HISTORY_LENGTH) {
          return newHistory.slice(-MAX_HISTORY_LENGTH);
        }
        return newHistory;
      });

      onLocationUpdate?.(update);
    });

    // Listen for status updates
    socket.on('shipment:status', (data: { status: string }) => {
      onStatusChange?.(data.status);
    });

    socketRef.current = socket;
  }, [shipmentId, driverId, onLocationUpdate, onStatusChange, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    }
  }, []);

  const sendLocation = useCallback((location: Omit<TrackingLocation, 'timestamp'>) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, cannot send location');
      return;
    }

    const update: TrackingUpdate = {
      shipmentId: shipmentId || '',
      driverId: driverId || undefined,
      location: {
        ...location,
        timestamp: new Date().toISOString(),
      },
    };

    socketRef.current.emit('driver:location', update);
  }, [shipmentId, driverId]);

  const clearHistory = useCallback(() => {
    setLocationHistory([]);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && (shipmentId || driverId)) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, shipmentId, driverId, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    currentLocation,
    locationHistory,
    lastUpdate,
    connect,
    disconnect,
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
          speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
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
