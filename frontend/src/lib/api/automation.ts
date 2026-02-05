/**
 * Automation Rules API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/types/api';
import type { AutomationRule } from '@/types/entities';

export interface CreateAutomationRuleRequest {
  name: string;
  triggerType: 'delay' | 'missing-update';
  threshold: number;
  thresholdUnit: 'hours';
  action: 'notify' | 'escalate';
}

export interface UpdateAutomationRuleRequest {
  name?: string;
  triggerType?: 'delay' | 'missing-update';
  threshold?: number;
  thresholdUnit?: 'hours';
  action?: 'notify' | 'escalate';
  active?: boolean;
}

export const automationApi = {
  async getAutomationRules(): Promise<ApiResponse<AutomationRule[]>> {
    const response = await apiClient.get<ApiResponse<{ rules: AutomationRule[] }>>(
      API_ENDPOINTS.automation.rules
    );
    return {
      success: true,
      data: response.data?.rules || [],
    };
  },

  async createAutomationRule(data: CreateAutomationRuleRequest): Promise<ApiResponse<AutomationRule>> {
    const response = await apiClient.post<ApiResponse<{ rule: AutomationRule }>>(
      API_ENDPOINTS.automation.rules,
      data
    );
    const rule = response.data?.rule;
    if (!rule) {
      throw new Error('Invalid response: automation rule data missing');
    }
    return {
      success: true,
      data: rule,
    };
  },

  async updateAutomationRule(
    id: string,
    data: UpdateAutomationRuleRequest
  ): Promise<ApiResponse<AutomationRule>> {
    const response = await apiClient.patch<ApiResponse<{ rule: AutomationRule }>>(
      API_ENDPOINTS.automation.rule(id),
      data
    );
    const rule = response.data?.rule;
    if (!rule) {
      throw new Error('Invalid response: automation rule data missing');
    }
    return {
      success: true,
      data: rule,
    };
  },
};

export default automationApi;
