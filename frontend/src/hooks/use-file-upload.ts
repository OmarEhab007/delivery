/**
 * File Upload Hook with Progress
 * Task: T140 [US8] - useFileUpload hook with progress tracking
 */

import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api/endpoints';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url?: string;
}

export interface UseFileUploadOptions {
  endpoint?: string;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (file: UploadedFile) => void;
  onError?: (error: Error) => void;
}

export interface UseFileUploadReturn {
  upload: (file: File, additionalData?: Record<string, string>) => Promise<UploadedFile>;
  uploadMultiple: (files: File[], additionalData?: Record<string, string>) => Promise<UploadedFile[]>;
  progress: UploadProgress | null;
  isUploading: boolean;
  error: Error | null;
  reset: () => void;
  abort: () => void;
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    endpoint = '/documents/upload',
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedTypes,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateFile = useCallback(
    (file: File): void => {
      // Check file size
      if (file.size > maxFileSize) {
        throw new Error(
          `حجم الملف كبير جداً. الحد الأقصى ${(maxFileSize / 1024 / 1024).toFixed(1)} ميجابايت`
        );
      }

      // Check file type
      if (allowedTypes && allowedTypes.length > 0) {
        const fileType = file.type || '';
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

        const isAllowed = allowedTypes.some((type) => {
          if (type.startsWith('.')) {
            return `.${fileExtension}` === type.toLowerCase();
          }
          if (type.endsWith('/*')) {
            return fileType.startsWith(type.replace('/*', '/'));
          }
          return fileType === type;
        });

        if (!isAllowed) {
          throw new Error(`نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(', ')}`);
        }
      }
    },
    [maxFileSize, allowedTypes]
  );

  const upload = useCallback(
    async (file: File, additionalData?: Record<string, string>): Promise<UploadedFile> => {
      // Validate file
      validateFile(file);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Add additional data
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // Create abort controller
      abortControllerRef.current = new AbortController();

      setIsUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      try {
        const response = await new Promise<UploadedFile>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Progress handler
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const uploadProgress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              };
              setProgress(uploadProgress);
              onProgress?.(uploadProgress);
            }
          });

          // Load handler
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                const uploadedFile: UploadedFile = {
                  id: response.data?._id || response._id,
                  name: response.data?.name || response.name || file.name,
                  size: response.data?.fileSize || response.fileSize || file.size,
                  mimeType: response.data?.mimeType || response.mimeType || file.type,
                  url: response.data?.filePath || response.filePath,
                };
                resolve(uploadedFile);
              } catch {
                reject(new Error('فشل تحليل استجابة الخادم'));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(new Error(errorResponse.message || 'فشل رفع الملف'));
              } catch {
                reject(new Error(`فشل رفع الملف: ${xhr.status}`));
              }
            }
          });

          // Error handler
          xhr.addEventListener('error', () => {
            reject(new Error('حدث خطأ في الشبكة أثناء رفع الملف'));
          });

          // Abort handler
          xhr.addEventListener('abort', () => {
            reject(new Error('تم إلغاء رفع الملف'));
          });

          // Open and send
          xhr.open('POST', `${API_BASE_URL}${endpoint}`);

          // Add auth header if token exists
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }

          // Store xhr for abort functionality
          abortControllerRef.current?.signal.addEventListener('abort', () => {
            xhr.abort();
          });

          xhr.send(formData);
        });

        onSuccess?.(response);
        return response;
      } catch (err) {
        const uploadError = err instanceof Error ? err : new Error('فشل رفع الملف');
        setError(uploadError);
        onError?.(uploadError);
        throw uploadError;
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [endpoint, validateFile, onProgress, onSuccess, onError]
  );

  const uploadMultiple = useCallback(
    async (files: File[], additionalData?: Record<string, string>): Promise<UploadedFile[]> => {
      const results: UploadedFile[] = [];

      for (const file of files) {
        const result = await upload(file, additionalData);
        results.push(result);
      }

      return results;
    },
    [upload]
  );

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setIsUploading(false);
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    upload,
    uploadMultiple,
    progress,
    isUploading,
    error,
    reset,
    abort,
  };
}

// =============================================================================
// FILE VALIDATION UTILITIES
// =============================================================================

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
export const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';

  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  return '📎';
}

export default useFileUpload;
