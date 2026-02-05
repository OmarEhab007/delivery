/**
 * Unit tests for use-url-filters hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('useUrlFilters', () => {
  const mockPush = jest.fn();
  const mockPathname = '/test';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
  });

  it('should initialize filters with defaults', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined; search: string | undefined }>({
        defaults: { status: 'all', search: undefined },
      })
    );

    expect(result.current.filters).toEqual({
      status: 'all',
      search: undefined,
    });
  });

  it('should return hasActiveFilters as false with only defaults', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined }>({
        defaults: { status: 'all' },
      })
    );

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should return filter values from URL search params', () => {
    const params = new URLSearchParams('status=active&search=test');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined; search: string | undefined }>({
        defaults: { status: 'all' },
      })
    );

    expect(result.current.filters).toEqual({
      status: 'active',
      search: 'test',
    });
  });

  it('should detect active filters when values differ from defaults', () => {
    const params = new URLSearchParams('status=active');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined }>({
        defaults: { status: 'all' },
      })
    );

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should not count empty strings as active filters', () => {
    const params = new URLSearchParams('status=&search=');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined; search: string | undefined }>({
        defaults: { status: 'all' },
      })
    );

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should not count "all" as active filter', () => {
    const params = new URLSearchParams('status=all');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined }>({
        defaults: { status: 'all' },
      })
    );

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should update URL when setFilter is called', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined }>({
        defaults: { status: 'all' },
        debounceMs: 0,
      })
    );

    result.current.setFilter('status', 'active');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/test?status=active', { scroll: false });
    });
  });

  it('should update URL when setFilters is called with multiple filters', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined; search: string | undefined }>({
        defaults: { status: 'all' },
        debounceMs: 0,
      })
    );

    result.current.setFilters({ status: 'active', search: 'test' });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/test?status=active&search=test', {
        scroll: false,
      });
    });
  });

  it('should reset filters to defaults when resetFilters is called', async () => {
    const params = new URLSearchParams('status=active&search=test');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined; search: string | undefined }>({
        defaults: { status: 'all' },
        debounceMs: 0,
      })
    );

    result.current.resetFilters();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/test', { scroll: false });
    });
  });

  it('should not add empty or "all" values to URL params', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined; search: string | undefined }>({
        defaults: { status: 'all' },
        debounceMs: 0,
      })
    );

    result.current.setFilters({ status: 'all', search: '' });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/test', { scroll: false });
    });
  });

  it('should merge existing filters with new ones when updating', async () => {
    const params = new URLSearchParams('status=active');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined; search: string | undefined }>({
        defaults: { status: 'all' },
        debounceMs: 0,
      })
    );

    result.current.setFilter('search', 'test');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/test?status=active&search=test', {
        scroll: false,
      });
    });
  });

  it('should debounce URL updates by default', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    const { result } = renderHook(() =>
      useUrlFilters<{ status: string | undefined }>({
        defaults: { status: 'all' },
        // Default debounceMs is 300
      })
    );

    result.current.setFilter('status', 'active');

    // Should not be called immediately
    expect(mockPush).not.toHaveBeenCalled();

    // Should be called after debounce
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });
});
