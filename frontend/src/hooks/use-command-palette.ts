/**
 * Command Palette Hook
 * Manages global search across shipments, trucks, and users
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { shipmentsApi, trucksApi, adminApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Shipment, Truck, User } from '@/types/entities';

const ROLE_ROUTE_PREFIX: Record<string, string> = {
  Admin: 'admin',
  Merchant: 'merchant',
  TruckOwner: 'truck-owner',
  Driver: 'driver',
};

export interface SearchResult {
  type: 'shipment' | 'truck' | 'driver' | 'user';
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

interface UseCommandPaletteReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * Hook for managing command palette state and search functionality
 */
export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const user = useAuthStore((s) => s.user);
  const routePrefix = ROLE_ROUTE_PREFIX[user?.role || 'Merchant'] || 'merchant';

  // Perform parallel searches across all entity types
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      // Fire parallel API calls
      const [shipmentsRes, trucksRes, usersRes] = await Promise.allSettled([
        shipmentsApi.list({ search: searchQuery, limit: 5 }),
        trucksApi.list({ search: searchQuery, limit: 5 }),
        adminApi.getUsers({ search: searchQuery, limit: 5 }).catch(() => null), // Admin only
      ]);

      const aggregatedResults: SearchResult[] = [];

      // Process shipments
      if (shipmentsRes.status === 'fulfilled' && shipmentsRes.value.data) {
        const shipments: Shipment[] = shipmentsRes.value.data;
        shipments.forEach((shipment) => {
          aggregatedResults.push({
            type: 'shipment',
            id: shipment._id,
            title: `شحنة #${shipment._id.slice(-6)}`,
            subtitle: `${shipment.origin.address} → ${shipment.destination.address}`,
            link: `/${routePrefix}/shipments/${shipment._id}`,
          });
        });
      }

      // Process trucks
      if (trucksRes.status === 'fulfilled' && trucksRes.value.data) {
        const trucks: Truck[] = trucksRes.value.data;
        trucks.forEach((truck) => {
          aggregatedResults.push({
            type: 'truck',
            id: truck._id,
            title: `${truck.plateNumber} - ${truck.model}`,
            subtitle: `الحمولة: ${truck.capacity} طن`,
            link: `/truck-owner/fleet/trucks/${truck._id}`,
          });
        });
      }

      // Process users (only if admin API succeeds)
      if (usersRes.status === 'fulfilled' && usersRes.value?.data?.users) {
        const users: User[] = usersRes.value.data.users;
        users.forEach((user) => {
          const isDriver = user.role === 'Driver';
          aggregatedResults.push({
            type: isDriver ? 'driver' : 'user',
            id: user._id,
            title: user.name,
            subtitle: `${user.email} - ${user.role}`,
            link: isDriver ? `/truck-owner/fleet/drivers/${user._id}` : `/admin/users/${user._id}`,
          });
        });
      }

      setResults(aggregatedResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [routePrefix]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query || query.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    results,
    isSearching,
  };
}
