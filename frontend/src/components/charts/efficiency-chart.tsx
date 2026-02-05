'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface EfficiencyChartProps {
  data?: Array<{
    period: string;
    totalShipments: number;
    completedShipments: number;
    cancelledShipments: number;
    delayedShipments: number;
    completionRate: number;
    cancellationRate: number;
    delayRate: number;
    avgDeliveryTime: number;
  }>;
  isLoading?: boolean;
}

export function EfficiencyChart({ data, isLoading }: EfficiencyChartProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>مقاييس الكفاءة</CardTitle>
          <CardDescription>معدلات الإنجاز والإلغاء والتأخير</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format percentage
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>مقاييس الكفاءة</CardTitle>
        <CardDescription>معدلات الإنجاز والإلغاء والتأخير</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="period"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickFormatter={formatPercent}
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
                if (name === 'completionRate') {
                  return [formatPercent(value), 'معدل الإنجاز'];
                }
                if (name === 'cancellationRate') {
                  return [formatPercent(value), 'معدل الإلغاء'];
                }
                if (name === 'delayRate') {
                  return [formatPercent(value), 'معدل التأخير'];
                }
                return [String(value), name];
              }) as never}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'completionRate') return 'معدل الإنجاز';
                if (value === 'cancellationRate') return 'معدل الإلغاء';
                if (value === 'delayRate') return 'معدل التأخير';
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="completionRate"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="completionRate"
            />
            <Line
              type="monotone"
              dataKey="cancellationRate"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="cancellationRate"
            />
            <Line
              type="monotone"
              dataKey="delayRate"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="delayRate"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default EfficiencyChart;
