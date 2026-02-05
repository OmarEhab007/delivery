/**
 * Document Query Hooks
 * Task: T139 [US8] - useDocuments query hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import type { GetDocumentsParams, VerifyDocumentRequest, EntityType } from '@/types/api';
import type { Document } from '@/types/entities';

// =============================================================================
// QUERY KEY FACTORY
// =============================================================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params: GetDocumentsParams) => [...documentKeys.lists(), params] as const,
  byEntity: (entityType: EntityType, entityId: string) =>
    [...documentKeys.all, 'entity', entityType, entityId] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * List documents with optional filters
 */
export function useDocuments(params: GetDocumentsParams = {}) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentsApi.list(params),
  });
}

/**
 * Get documents by entity (Shipment, Application, Truck, User)
 */
export function useEntityDocuments(entityType: EntityType, entityId: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.byEntity(entityType, entityId),
    queryFn: () => documentsApi.listByEntity(entityType, entityId),
    enabled: enabled && !!entityId,
  });
}

/**
 * Get a single document by ID
 */
export function useDocument(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.get(id),
    enabled: enabled && !!id,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Upload a document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => documentsApi.upload(formData),
    onSuccess: (_, variables) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

      // Try to extract entityType and entityId from FormData to invalidate entity-specific cache
      const entityType = variables.get('entityType') as EntityType | null;
      const entityId = variables.get('entityId') as string | null;
      if (entityType && entityId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.byEntity(entityType, entityId),
        });
      }
    },
  });
}

/**
 * Verify a document (Admin only)
 */
export function useVerifyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VerifyDocumentRequest }) =>
      documentsApi.verify(id, data),
    onSuccess: (response) => {
      const document = response.data;
      // Update the specific document in cache
      queryClient.setQueryData(documentKeys.detail(document._id), response);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      // Invalidate entity-specific cache
      if (document.entityType && document.entityId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.byEntity(document.entityType as EntityType, document.entityId),
        });
      }
    },
  });
}

/**
 * Delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/**
 * Download a document
 */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (document: Document) => {
      const blob = await documentsApi.download(document._id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName || document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return blob;
    },
  });
}

// Intentionally no default export to keep lint clean.
