/**
 * Documents API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  GetDocumentsParams,
  VerifyDocumentRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';
import type { Document } from '@/types/entities';

export const documentsApi = {
  async list(params?: GetDocumentsParams): Promise<PaginatedResponse<Document>> {
    return apiClient.get<PaginatedResponse<Document>>(
      API_ENDPOINTS.documents.list,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async listByEntity(entityType: string, entityId: string): Promise<ApiResponse<Document[]>> {
    return apiClient.get<ApiResponse<Document[]>>(
      API_ENDPOINTS.documents.byEntity(entityType, entityId)
    );
  },

  async upload(formData: FormData): Promise<ApiResponse<Document>> {
    return apiClient.upload<ApiResponse<Document>>(API_ENDPOINTS.documents.upload, formData);
  },

  async get(id: string): Promise<ApiResponse<Document>> {
    return apiClient.get<ApiResponse<Document>>(API_ENDPOINTS.documents.get(id));
  },

  async download(id: string): Promise<Blob> {
    return apiClient.get<Blob>(API_ENDPOINTS.documents.download(id));
  },

  async verify(id: string, data: VerifyDocumentRequest): Promise<ApiResponse<Document>> {
    return apiClient.post<ApiResponse<Document>>(API_ENDPOINTS.documents.verify(id), data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.documents.delete(id));
  },
};

export default documentsApi;
