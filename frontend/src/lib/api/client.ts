/**
 * API Client with fetch wrapper
 * Handles authentication, token refresh, and error handling
 */

import { API_BASE_URL, API_ENDPOINTS } from './endpoints';
import type { ApiError } from '@/types/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<void> | null = null;
let csrfToken: string | null = null;
let csrfPromise: Promise<string | null> | null = null;

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;

  // Store in localStorage for persistence (client-side only)
  if (typeof window !== 'undefined') {
    if (access) {
      localStorage.setItem('accessToken', access);
    } else {
      localStorage.removeItem('accessToken');
    }
    if (refresh) {
      localStorage.setItem('refreshToken', refresh);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }
}

export function getTokens() {
  // Try to restore from localStorage if not in memory
  if (typeof window !== 'undefined' && !accessToken) {
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
  }
  return { accessToken, refreshToken };
}

export function clearTokens() {
  setTokens(null, null);
}

async function fetchCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const { accessToken: token } = getTokens();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.csrf}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      const headerToken =
        response.headers.get('X-CSRF-Token') || response.headers.get('x-csrf-token');
      csrfToken = headerToken || null;
      return csrfToken;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
}

async function refreshAccessToken(): Promise<void> {
  const { refreshToken: token } = getTokens();
  if (!token) {
    throw new ApiClientError('No refresh token available', 401);
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: token }),
    credentials: 'include',
  });

  if (!response.ok) {
    clearTokens();
    throw new ApiClientError('Token refresh failed', 401);
  }

  const data = await response.json();
  setTokens(data.accessToken, data.refreshToken);
}

async function handleRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...fetchConfig } = config;

  // Build URL with query params
  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Get current access token
  const { accessToken: token } = getTokens();

  const method = (fetchConfig.method || 'GET').toUpperCase();
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchConfig.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (needsCsrf) {
    const csrf = await fetchCsrfToken();
    if (csrf) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrf;
    }
  }

  // Make request
  let response = await fetch(url, {
    ...fetchConfig,
    headers,
    credentials: 'include',
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && refreshToken) {
    // Prevent multiple simultaneous refresh attempts
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;

      // Retry request with new token
      const { accessToken: newToken } = getTokens();
      if (newToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      }

      response = await fetch(url, {
        ...fetchConfig,
        headers,
        credentials: 'include',
      });
    } catch {
      // Refresh failed, clear tokens and throw
      clearTokens();
      throw new ApiClientError('Session expired. Please log in again.', 401);
    }
  }

  // Handle CSRF token errors (403)
  if (response.status === 403 && needsCsrf) {
    try {
      const clone = response.clone();
      const errorData = (await clone.json()) as ApiError;
      if (errorData?.message && /csrf/i.test(errorData.message)) {
        csrfToken = null;
        const newCsrf = await fetchCsrfToken();
        if (newCsrf) {
          (headers as Record<string, string>)['X-CSRF-Token'] = newCsrf;
        }
        response = await fetch(url, {
          ...fetchConfig,
          headers,
          credentials: 'include',
        });
      }
    } catch {
      // Ignore parse errors and fall through to error handling
    }
  }

  // Parse response
  const contentType = response.headers.get('content-type');
  let data: T | ApiError;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else if (contentType?.includes('application/octet-stream') || contentType?.includes('blob')) {
    return (await response.blob()) as T;
  } else {
    data = { success: false, message: await response.text() } as ApiError;
  }

  // Handle errors
  if (!response.ok) {
    const errorData = data as ApiError;
    throw new ApiClientError(
      errorData.message || 'An error occurred',
      response.status,
      errorData.errors
    );
  }

  return data as T;
}

// HTTP method helpers
export const apiClient = {
  get: <T>(endpoint: string, params?: RequestConfig['params']) =>
    handleRequest<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    handleRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...config,
    }),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    handleRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...config,
    }),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    handleRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...config,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    handleRequest<T>(endpoint, { method: 'DELETE', ...config }),

  // Special method for file uploads
  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const { accessToken: token } = getTokens();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const csrf = await fetchCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    let response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (response.status === 403) {
      try {
        const clone = response.clone();
        const errorData = (await clone.json()) as ApiError;
        if (errorData?.message && /csrf/i.test(errorData.message)) {
          csrfToken = null;
          const newCsrf = await fetchCsrfToken();
          if (newCsrf) {
            headers['X-CSRF-Token'] = newCsrf;
          }
          response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
            credentials: 'include',
          });
        }
      } catch {
        // ignore
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiClientError(
        data.message || 'Upload failed',
        response.status,
        data.errors
      );
    }

    return data as T;
  },
};

export default apiClient;
