/**
 * Integration API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/types/api';
import type {
  IntegrationCredential,
  CreateCredentialResponse,
  WebhookSubscription,
} from '@/types/entities';

export interface CreateCredentialRequest {
  name: string;
  scopes: Array<'shipments:read' | 'shipments:write' | 'webhooks:read' | 'webhooks:write'>;
}

export interface CreateWebhookRequest {
  endpointUrl: string;
  eventTypes: string[];
}

export const integrationsApi = {
  async getCredentials(): Promise<ApiResponse<IntegrationCredential[]>> {
    const response = await apiClient.get<ApiResponse<{ credentials: IntegrationCredential[] }>>(
      API_ENDPOINTS.integration.credentials
    );
    return {
      success: true,
      data: response.data?.credentials || [],
    };
  },

  async createCredential(data: CreateCredentialRequest): Promise<ApiResponse<CreateCredentialResponse>> {
    const response = await apiClient.post<ApiResponse<CreateCredentialResponse>>(
      API_ENDPOINTS.integration.credentials,
      data
    );
    return {
      success: true,
      data: response.data as CreateCredentialResponse,
    };
  },

  async getWebhooks(): Promise<ApiResponse<WebhookSubscription[]>> {
    const response = await apiClient.get<ApiResponse<{ webhooks: WebhookSubscription[] }>>(
      API_ENDPOINTS.integration.webhooks
    );
    return {
      success: true,
      data: response.data?.webhooks || [],
    };
  },

  async createWebhook(data: CreateWebhookRequest): Promise<ApiResponse<WebhookSubscription>> {
    const response = await apiClient.post<ApiResponse<{ webhook: WebhookSubscription }>>(
      API_ENDPOINTS.integration.webhooks,
      data
    );
    return {
      success: true,
      data: response.data?.webhook || (response.data as unknown as WebhookSubscription),
    };
  },
};

export default integrationsApi;
