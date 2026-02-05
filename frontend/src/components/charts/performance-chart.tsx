'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Users, Truck } from 'lucide-react';

interface PerformanceChartProps {
  data?: Array<{
    _id: string;
    driverName?: string;
    driverEmail?: string;
    totalShipments: number;
    totalDistance: number;
    averageRating: number;
    onTimeDeliveryRate: number;
  }>;
  isLoading?: boolean;
}

export function PerformanceChart({ data, isLoading }: PerformanceChartProps) {
  const [viewMode, setViewMode] = useState<'driver' | 'truck'>('driver');

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>أداء السائقين والشاحنات</CardTitle>
          <CardDescription>أفضل أداء حسب السائق أو الشاحنة</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format percentage
  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>أداء السائقين والشاحنات</CardTitle>
            <CardDescription>أفضل أداء حسب السائق أو الشاحنة</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'driver' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('driver')}
            >
              <Users className="ml-2 h-4 w-4" />
              السائقين
            </Button>
            <Button
              variant={viewMode === 'truck' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('truck')}
            >
              <Truck className="ml-2 h-4 w-4" />
              الشاحنات
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey={viewMode === 'driver' ? 'driverName' : '_id'}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              yAxisId="left"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
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
                if (name === 'totalShipments') {
                  return [String(value), 'إجمالي الشحنات'];
                }
                if (name === 'onTimeDeliveryRate') {
                  return [formatPercent(value), 'معدل التسليم في الوقت المحدد'];
                }
                return [String(value), name];
              }) as never}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'totalShipments') return 'إجمالي الشحنات';
                if (value === 'onTimeDeliveryRate') return 'معدل التسليم في الوقت المحدد';
                return value;
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="totalShipments"
              fill="#3B82F6"
              radius={[8, 8, 0, 0]}
              name="totalShipments"
            />
            <Bar
              yAxisId="right"
              dataKey="onTimeDeliveryRate"
              fill="#10B981"
              radius={[8, 8, 0, 0]}
              name="onTimeDeliveryRate"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default PerformanceChart;
