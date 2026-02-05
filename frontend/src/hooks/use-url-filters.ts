/**
 * Generic URL-based filter state management hook
 * Syncs filter state with URL query parameters for shareable filtering
 */

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, useRef, useEffect } from 'react';

type FilterValue = string | undefined;
type FilterState<T extends Record<string, FilterValue>> = T;

interface UseUrlFiltersOptions<T extends Record<string, FilterValue>> {
  defaults?: Partial<T>;
  debounceMs?: number;
}

interface UseUrlFiltersReturn<T extends Record<string, FilterValue>> {
  filters: FilterState<T>;
  setFilter: (key: keyof T, value: FilterValue) => void;
  setFilters: (updates: Partial<T>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Hook to manage filter state synchronized with URL query parameters
 *
 * @example
 * const { filters, setFilter, setFilters, resetFilters } = useUrlFilters<{
 *   status: string | undefined;
 *   search: string | undefined;
 *   dateFrom: string | undefined;
 * }>({
 *   defaults: { status: 'all' }
 * });
 */
export function useUrlFilters<T extends Record<string, FilterValue>>(
  options: UseUrlFiltersOptions<T> = {}
): UseUrlFiltersReturn<T> {
  const { defaults = {} as Partial<T>, debounceMs = 300 } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Parse current filters from URL
  const filters = useMemo(() => {
    const result = { ...defaults } as FilterState<T>;

    searchParams.forEach((value, key) => {
      if (value) {
        (result as Record<string, FilterValue>)[key] = value;
      }
    });

    return result;
  }, [searchParams, defaults]);

  // Check if any filters are active (not default values)
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = defaults[key as keyof T];
      return value !== undefined && value !== defaultValue && value !== '' && value !== 'all';
    });
  }, [filters, defaults]);

  // Debounced URL update function
  const updateUrl = useCallback(
    (newFilters: Partial<T>) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams();

        // Merge current filters with new ones
        const mergedFilters = { ...filters, ...newFilters };

        // Add non-empty filters to params
        Object.entries(mergedFilters).forEach(([key, value]) => {
          if (value && value !== 'all' && value !== '') {
            params.set(key, String(value));
          }
        });

        // Use shallow navigation to update URL without full page reload
        const queryString = params.toString();
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

        router.push(newUrl, { scroll: false });
      }, debounceMs);
    },
    [filters, pathname, router, debounceMs]
  );

  // Set a single filter
  const setFilter = useCallback(
    (key: keyof T, value: FilterValue) => {
      updateUrl({ [key]: value } as Partial<T>);
    },
    [updateUrl]
  );

  // Set multiple filters at once
  const setFilters = useCallback(
    (updates: Partial<T>) => {
      updateUrl(updates);
    },
    [updateUrl]
  );

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const params = new URLSearchParams();

    // Only add default values that are not empty
    Object.entries(defaults).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, String(value));
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(newUrl, { scroll: false });
  }, [defaults, pathname, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
  };
}
