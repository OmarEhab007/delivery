/**
 * Brokers API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/types/api';
import type { Broker } from '@/types/entities';
import type { BrokerFormData } from '@/lib/validations';

export const brokersApi = {
  async getBrokers(): Promise<ApiResponse<{ brokers: Broker[] }>> {
    return apiClient.get<ApiResponse<{ brokers: Broker[] }>>(API_ENDPOINTS.brokers.list);
  },

  async getBroker(id: string): Promise<ApiResponse<{ broker: Broker }>> {
    return apiClient.get<ApiResponse<{ broker: Broker }>>(API_ENDPOINTS.brokers.detail(id));
  },

  async createBroker(data: BrokerFormData): Promise<ApiResponse<{ broker: Broker }>> {
    return apiClient.post<ApiResponse<{ broker: Broker }>>(API_ENDPOINTS.brokers.list, data);
  },

  async updateBroker(id: string, data: Partial<BrokerFormData>): Promise<ApiResponse<{ broker: Broker }>> {
    return apiClient.put<ApiResponse<{ broker: Broker }>>(API_ENDPOINTS.brokers.detail(id), data);
  },

  async deactivateBroker(id: string): Promise<ApiResponse<{ broker: Broker }>> {
    return apiClient.patch<ApiResponse<{ broker: Broker }>>(API_ENDPOINTS.brokers.detail(id), {
      status: 'INACTIVE',
    });
  },
};

export default brokersApi;
