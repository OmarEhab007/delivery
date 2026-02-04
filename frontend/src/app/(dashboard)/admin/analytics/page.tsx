'use client';

import { BarChart3, TrendingUp, Users, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '@/components/shared/stats-cards';
import { useAdminDashboard } from '@/hooks/use-admin';

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useAdminDashboard();
  const stats = data?.data;

  const cards = [
    {
      title: 'إجمالي الشحنات',
      value: stats?.shipments.total ?? '--',
      description: 'كل الشحنات',
      icon: BarChart3,
    },
    {
      title: 'شحنات قيد التنفيذ',
      value: stats?.shipments.inTransit ?? '--',
      description: 'نشطة حالياً',
      icon: TrendingUp,
      variant: 'primary' as const,
    },
    {
      title: 'إجمالي المستخدمين',
      value: stats?.users.total ?? '--',
      description: 'كل الأدوار',
      icon: Users,
    },
    {
      title: 'الشاحنات المتاحة',
      value: stats?.trucks.available ?? '--',
      description: 'جاهزة للعمل',
      icon: Truck,
      variant: 'success' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التحليلات</h1>
        <p className="text-muted-foreground">مؤشرات الأداء العامة للنظام</p>
      </div>

      <StatsCards stats={cards} isLoading={isLoading} columns={2} />

      <Card>
        <CardHeader>
          <CardTitle>ملاحظة</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          سيتم توسيع لوحة التحليلات لعرض تقارير تفصيلية (الأرباح، الأداء، واتجاهات الشحنات)
          عبر واجهات التقارير الخلفية.
        </CardContent>
      </Card>
    </div>
  );
}
