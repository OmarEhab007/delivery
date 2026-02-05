'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to auto-save form data to sessionStorage with debouncing.
 * Restores data on mount and clears on successful submission.
 */
export function useFormAutosave<T>(
  key: string,
  data: T,
  options?: { debounceMs?: number }
) {
  const { debounceMs = 2000 } = options || {};
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save with debounce
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(`form-autosave:${key}`, JSON.stringify(data));
      } catch {
        // sessionStorage might be full or unavailable
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [key, data, debounceMs]);

  // Restore saved data
  const restore = useCallback((): T | null => {
    try {
      const saved = sessionStorage.getItem(`form-autosave:${key}`);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }, [key]);

  // Clear saved data (call on successful submit)
  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(`form-autosave:${key}`);
    } catch {
      // ignore
    }
  }, [key]);

  return { restore, clear };
}
