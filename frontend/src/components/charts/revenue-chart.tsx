'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueChartProps {
  data?: Array<{
    period: string;
    totalRevenue: number;
    shipmentCount: number;
    averageRevenuePerShipment: number;
  }>;
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تحليل الإيرادات</CardTitle>
          <CardDescription>الإيرادات وعدد الشحنات عبر الزمن</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format numbers for display
  const formatRevenue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تحليل الإيرادات</CardTitle>
        <CardDescription>الإيرادات وعدد الشحنات عبر الزمن</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="period"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickFormatter={formatRevenue}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              formatter={((value: number, name: string) => {
                if (name === 'totalRevenue') {
                  return [formatRevenue(value), 'إجمالي الإيرادات'];
                }
                if (name === 'shipmentCount') {
                  return [String(value), 'عدد الشحنات'];
                }
                return [String(value), name];
              }) as never}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'totalRevenue') return 'إجمالي الإيرادات';
                if (value === 'shipmentCount') return 'عدد الشحنات';
                return value;
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="totalRevenue"
              fill="#3B82F6"
              radius={[8, 8, 0, 0]}
              name="totalRevenue"
            />
            <Bar
              yAxisId="right"
              dataKey="shipmentCount"
              fill="#10B981"
              radius={[8, 8, 0, 0]}
              name="shipmentCount"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default RevenueChart;
