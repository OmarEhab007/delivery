'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsParams } from '@/lib/api/analytics';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const analyticsKeys = {
  all: ['analytics'] as const,
  kpis: (params?: AnalyticsParams) => [...analyticsKeys.all, 'kpis', params] as const,
  lanes: (params?: AnalyticsParams) => [...analyticsKeys.all, 'lanes', params] as const,
  statusTrends: (params?: AnalyticsParams) => [...analyticsKeys.all, 'status-trends', params] as const,
  revenue: (params?: AnalyticsParams) => [...analyticsKeys.all, 'revenue', params] as const,
  performance: (params?: AnalyticsParams) => [...analyticsKeys.all, 'performance', params] as const,
  customers: (params?: AnalyticsParams) => [...analyticsKeys.all, 'customers', params] as const,
  efficiency: (params?: AnalyticsParams) => [...analyticsKeys.all, 'efficiency', params] as const,
  geo: (params?: AnalyticsParams) => [...analyticsKeys.all, 'geo', params] as const,
};

export function useKpiSummary(params?: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.kpis(params),
    queryFn: () => analyticsApi.getKpiSummary(params),
    staleTime: STALE_TIME,
  });
}

export function useStatusTrends(params?: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.statusTrends(params),
    queryFn: () => analyticsApi.getStatusTrends(params),
    staleTime: STALE_TIME,
  });
}

export function useRevenueAnalysis(params?: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.revenue(params),
    queryFn: () => analyticsApi.getRevenueAnalysis(params),
    staleTime: STALE_TIME,
  });
}

export function usePerformanceMetrics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.performance(params),
    queryFn: () => analyticsApi.getPerformanceMetrics(params),
    staleTime: STALE_TIME,
  });
}

export function useCustomerInsights(params?: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.customers(params),
    queryFn: () => analyticsApi.getCustomerInsights(params),
    staleTime: STALE_TIME,
  });
}

export function useEfficiencyMetrics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.efficiency(params),
    queryFn: () => analyticsApi.getEfficiencyMetrics(params),
    staleTime: STALE_TIME,
  });
}

export function useGeoAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.geo(params),
    queryFn: () => analyticsApi.getGeoAnalytics(params),
    staleTime: STALE_TIME,
  });
}
