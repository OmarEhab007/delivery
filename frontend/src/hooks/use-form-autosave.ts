'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to auto-save form data to sessionStorage with debouncing.
 * Call `restore()` manually to retrieve saved data, and `clear()` on successful submission.
 * Flushes pending saves on unmount to prevent data loss.
 */
export function useFormAutosave<T>(
  key: string,
  data: T,
  options?: { debounceMs?: number }
) {
  const { debounceMs = 2000 } = options || {};
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  const keyRef = useRef(key);

  // Keep refs updated for cleanup access
  dataRef.current = data;
  keyRef.current = key;

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
        // Flush pending save on unmount
        try {
          sessionStorage.setItem(
            `form-autosave:${keyRef.current}`,
            JSON.stringify(dataRef.current)
          );
        } catch {
          // ignore
        }
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
