/**
 * Analytics API Methods
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  KpiResponse,
  LanePerformanceResponse,
  StatusTrendsResponse,
  RevenueResponse,
  PerformanceResponse,
  CustomerInsightsResponse,
  EfficiencyResponse,
  GeoResponse,
} from '@/types/api';

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
}

export const analyticsApi = {
  async getKpiSummary(params?: AnalyticsParams): Promise<KpiResponse> {
    return apiClient.get<KpiResponse>(
      API_ENDPOINTS.analytics.kpis,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getLanePerformance(params?: AnalyticsParams): Promise<LanePerformanceResponse> {
    return apiClient.get<LanePerformanceResponse>(
      API_ENDPOINTS.analytics.lanes,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getStatusTrends(params?: AnalyticsParams): Promise<StatusTrendsResponse> {
    return apiClient.get<StatusTrendsResponse>(
      API_ENDPOINTS.reports.statusTrends,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getRevenueAnalysis(params?: AnalyticsParams): Promise<RevenueResponse> {
    return apiClient.get<RevenueResponse>(
      API_ENDPOINTS.reports.revenue,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getPerformanceMetrics(params?: AnalyticsParams): Promise<PerformanceResponse> {
    return apiClient.get<PerformanceResponse>(
      API_ENDPOINTS.reports.performance,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getCustomerInsights(params?: AnalyticsParams): Promise<CustomerInsightsResponse> {
    return apiClient.get<CustomerInsightsResponse>(
      API_ENDPOINTS.reports.customers,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getEfficiencyMetrics(params?: AnalyticsParams): Promise<EfficiencyResponse> {
    return apiClient.get<EfficiencyResponse>(
      API_ENDPOINTS.reports.efficiency,
      params as Record<string, string | number | boolean | undefined>
    );
  },

  async getGeoAnalytics(params?: AnalyticsParams): Promise<GeoResponse> {
    return apiClient.get<GeoResponse>(
      API_ENDPOINTS.reports.geo,
      params as Record<string, string | number | boolean | undefined>
    );
  },
};

export default analyticsApi;
