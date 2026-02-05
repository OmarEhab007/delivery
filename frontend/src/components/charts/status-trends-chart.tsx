'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusTrendsChartProps {
  data?: Array<{
    period: string;
    statuses: Record<string, number>;
  }>;
  isLoading?: boolean;
}

// Arabic labels for shipment statuses
const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'انتظار الموافقة',
  REQUESTED: 'مطلوب',
  CONFIRMED: 'مؤكد',
  ASSIGNED: 'معين',
  LOADING: 'يتم التحميل',
  IN_TRANSIT: 'في الطريق',
  UNLOADING: 'يتم التفريغ',
  AT_BORDER: 'عند الحدود',
  DELIVERED: 'تم التسليم',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  DELAYED: 'متأخر',
  REJECTED: 'مرفوض',
};

// Color scheme for statuses
const statusColors: Record<string, string> = {
  PENDING_APPROVAL: '#F59E0B',
  REQUESTED: '#8B5CF6',
  CONFIRMED: '#3B82F6',
  ASSIGNED: '#06B6D4',
  LOADING: '#10B981',
  IN_TRANSIT: '#6366F1',
  UNLOADING: '#14B8A6',
  AT_BORDER: '#F97316',
  DELIVERED: '#22C55E',
  COMPLETED: '#10B981',
  CANCELLED: '#EF4444',
  DELAYED: '#F59E0B',
  REJECTED: '#DC2626',
};

export function StatusTrendsChart({ data, isLoading }: StatusTrendsChartProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>اتجاهات حالة الشحنات</CardTitle>
          <CardDescription>تطور حالات الشحنات عبر الزمن</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for Recharts
  const chartData = data.map((item) => ({
    period: item.period,
    ...item.statuses,
  }));

  // Get all unique statuses
  const allStatuses = new Set<string>();
  data.forEach((item) => {
    Object.keys(item.statuses).forEach((status) => allStatuses.add(status));
  });
  const statusList = Array.from(allStatuses);

  return (
    <Card>
      <CardHeader>
        <CardTitle>اتجاهات حالة الشحنات</CardTitle>
        <CardDescription>تطور حالات الشحنات عبر الزمن</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="period"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => statusLabels[value] || value}
            />
            {statusList.map((status) => (
              <Area
                key={status}
                type="monotone"
                dataKey={status}
                stackId="1"
                stroke={statusColors[status] || '#8B5CF6'}
                fill={statusColors[status] || '#8B5CF6'}
                fillOpacity={0.6}
                name={status}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default StatusTrendsChart;
