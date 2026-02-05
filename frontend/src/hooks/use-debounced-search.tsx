'use client';

/**
 * Debounced Search Hook
 * Task: T149 [P] - Add debounced search to all table components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// =============================================================================
// TYPES
// =============================================================================

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
  syncWithUrl?: boolean;
  urlParam?: string;
}

interface UseDebouncedSearchReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (value: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
}

// =============================================================================
// DEBOUNCE UTILITY
// =============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useDebouncedSearch({
  delay = 300,
  minLength = 0,
  syncWithUrl = false,
  urlParam = 'search',
}: UseDebouncedSearchOptions = {}): UseDebouncedSearchReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial value from URL if syncing
  const initialValue = syncWithUrl ? searchParams.get(urlParam) || '' : '';
  const [searchTerm, setSearchTermState] = useState(initialValue);

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  // Track if we're in the middle of debouncing
  const isSearching = searchTerm !== debouncedSearchTerm;

  // Sync with URL when debounced value changes
  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearchTerm && debouncedSearchTerm.length >= minLength) {
      params.set(urlParam, debouncedSearchTerm);
    } else {
      params.delete(urlParam);
    }

    // Reset to page 1 when search changes
    params.delete('page');

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearchTerm, syncWithUrl, urlParam, minLength, pathname, router, searchParams]);

  // Set search term handler
  const setSearchTerm = useCallback((value: string) => {
    setSearchTermState(value);
  }, []);

  // Clear search handler
  const clearSearch = useCallback(() => {
    setSearchTermState('');
  }, []);

  // Only return debounced value if it meets minimum length
  const effectiveDebouncedTerm = useMemo(() => {
    return debouncedSearchTerm.length >= minLength ? debouncedSearchTerm : '';
  }, [debouncedSearchTerm, minLength]);

  return {
    searchTerm,
    debouncedSearchTerm: effectiveDebouncedTerm,
    setSearchTerm,
    clearSearch,
    isSearching,
  };
}

// =============================================================================
// SEARCH INPUT COMPONENT
// =============================================================================

import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isSearching?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'بحث...',
  isSearching = false,
  className,
  autoFocus = false,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-9 pl-9"
        autoFocus={autoFocus}
      />
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isSearching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {value && !isSearching && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COMBINED HOOK WITH FILTERS
// =============================================================================

interface UseSearchWithFiltersOptions<TFilters> {
  initialFilters?: TFilters;
  searchDelay?: number;
  syncWithUrl?: boolean;
}

interface UseSearchWithFiltersReturn<TFilters> extends UseDebouncedSearchReturn {
  filters: TFilters;
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  setFilters: (filters: Partial<TFilters>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export function useSearchWithFilters<TFilters extends Record<string, unknown>>({
  initialFilters = {} as TFilters,
  searchDelay = 300,
  syncWithUrl = false,
}: UseSearchWithFiltersOptions<TFilters> = {}): UseSearchWithFiltersReturn<TFilters> {
  const [filters, setFiltersState] = useState<TFilters>(initialFilters);

  const search = useDebouncedSearch({
    delay: searchDelay,
    syncWithUrl,
  });

  const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((newFilters: Partial<TFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
    search.clearSearch();
  }, [initialFilters, search]);

  const hasActiveFilters = useMemo(() => {
    const hasSearch = search.debouncedSearchTerm.length > 0;
    const hasFilters = Object.entries(filters).some(([key, value]) => {
      const initial = initialFilters[key as keyof TFilters];
      return value !== initial && value !== '' && value !== undefined && value !== null;
    });
    return hasSearch || hasFilters;
  }, [search.debouncedSearchTerm, filters, initialFilters]);

  return {
    ...search,
    filters,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
  };
}

export default useDebouncedSearch;
