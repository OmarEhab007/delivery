/**
 * Infinite Scroll Hook
 * Task: T148 [P] - Implement infinite scroll for list pages
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { PaginatedResponse } from '@/types/api';

// =============================================================================
// TYPES
// =============================================================================

interface UseInfiniteScrollOptions<TData> {
  queryKey: readonly unknown[];
  queryFn: (params: { pageParam: number }) => Promise<PaginatedResponse<TData>>;
  getNextPageParam?: (lastPage: PaginatedResponse<TData>) => number | undefined;
  enabled?: boolean;
  initialPageParam?: number;
  staleTime?: number;
}

interface UseInfiniteScrollReturn<TData> {
  data: TData[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  error: Error | null;
  totalCount: number;
  loadMoreRef: (node: HTMLElement | null) => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useInfiniteScroll<TData>({
  queryKey,
  queryFn,
  getNextPageParam,
  enabled = true,
  initialPageParam = 1,
  staleTime = 5 * 60 * 1000,
}: UseInfiniteScrollOptions<TData>): UseInfiniteScrollReturn<TData> {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [loadMoreElement, setLoadMoreElement] = useState<HTMLElement | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => queryFn({ pageParam: pageParam as number }),
    getNextPageParam: getNextPageParam || ((lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    }),
    enabled,
    initialPageParam,
    staleTime,
  });

  // Flatten all pages data
  const flatData = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.pagination.total || 0;

  // Setup intersection observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    if (loadMoreElement) {
      observerRef.current.observe(loadMoreElement);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loadMoreElement, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const loadMoreRef = useCallback((node: HTMLElement | null) => {
    setLoadMoreElement(node);
  }, []);

  return {
    data: flatData,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    refetch,
    error: error as Error | null,
    totalCount,
    loadMoreRef,
  };
}

// =============================================================================
// LOAD MORE TRIGGER COMPONENT
// =============================================================================

interface LoadMoreTriggerProps {
  loadMoreRef: (node: HTMLElement | null) => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}

export function LoadMoreTrigger({
  loadMoreRef,
  isFetchingNextPage,
  hasNextPage,
}: LoadMoreTriggerProps) {
  if (!hasNextPage) return null;

  return (
    <div
      ref={loadMoreRef}
      className="flex items-center justify-center py-4"
    >
      {isFetchingNextPage && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">جاري التحميل...</span>
        </div>
      )}
    </div>
  );
}

export default useInfiniteScroll;
