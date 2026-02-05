'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { getTokens } from '@/lib/api/client';
import type { ConnectionStatus } from '@/components/shared/connection-status';

interface SocketContextValue {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connectionStatus: 'disconnected',
  isConnected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const reconnectAttemptRef = useRef(0);
  const maxReconnectDelay = 30000;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const { accessToken } = getTokens();
    if (!accessToken) return;

    setConnectionStatus('connecting');

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: maxReconnectDelay,
      auth: { token: accessToken },
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');
      reconnectAttemptRef.current = 0;
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      reconnectAttemptRef.current += 1;
      setConnectionStatus('error');
    });

    socketRef.current = socket;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const value: SocketContextValue = {
    socket: socketRef.current,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
