'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KPIDashboard } from '@/components/charts/kpi-charts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { MerchantKPIsResponse, GetMerchantKPIsParams } from '@/types/api';

// Helper to get date range based on period
function getDateRange(period: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];

  switch (period) {
    case '7d':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: weekAgo.toISOString().split('T')[0], endDate };
    case '30d':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: monthAgo.toISOString().split('T')[0], endDate };
    case '90d':
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { startDate: quarterAgo.toISOString().split('T')[0], endDate };
    case '1y':
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return { startDate: yearAgo.toISOString().split('T')[0], endDate };
    default:
      return {};
  }
}

// KPI query hook
function useMerchantKPIs(params?: GetMerchantKPIsParams) {
  return useQuery({
    queryKey: ['merchant-kpis', params],
    queryFn: async () => {
      const response = await apiClient.get<MerchantKPIsResponse>(
        '/analytics/merchant/kpis',
        params as Record<string, string | number | boolean | undefined>
      );
      return response;
    },
  });
}

const periodOptions = [
  { value: '7d', label: 'آخر 7 أيام' },
  { value: '30d', label: 'آخر 30 يوم' },
  { value: '90d', label: 'آخر 3 أشهر' },
  { value: '1y', label: 'آخر سنة' },
  { value: 'all', label: 'كل الوقت' },
];

export default function MerchantAnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const dateRange = getDateRange(period);

  const { data: kpisData, isLoading } = useMerchantKPIs(dateRange);

  const kpis = kpisData?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/merchant/dashboard">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">التحليلات والتقارير</h1>
            <p className="text-muted-foreground">
              متابعة أداء شحناتك وتحليل البيانات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="ml-2 h-4 w-4" />
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" disabled>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <KPIDashboard data={kpis} isLoading={isLoading} />

      {/* Additional insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>نصائح لتحسين الأداء</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">احصل على أفضل العروض</h4>
              <p className="text-sm text-muted-foreground mt-1">
                قدم وصفاً تفصيلياً للبضاعة لجذب الناقلين المناسبين
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">خطط مسبقاً</h4>
              <p className="text-sm text-muted-foreground mt-1">
                إنشاء الشحنات قبل 3-5 أيام يمنحك المزيد من خيارات الأسعار
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">قيّم الناقلين</h4>
              <p className="text-sm text-muted-foreground mt-1">
                تقييمك يساعد في تحسين جودة الخدمة للجميع
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الوصول السريع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/merchant/shipments/new">
                إنشاء شحنة جديدة
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/merchant/shipments?status=REQUESTED">
                مراجعة العروض المعلقة
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/merchant/shipments?status=IN_TRANSIT">
                تتبع الشحنات النشطة
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/merchant/shipments?status=COMPLETED">
                الشحنات المكتملة
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
