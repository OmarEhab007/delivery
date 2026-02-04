'use client';

import Link from 'next/link';
import { Users, Package, ClipboardList, Truck, CheckSquare, BarChart3 } from 'lucide-react';
import { StatsCards } from '@/components/shared/stats-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminDashboard } from '@/hooks/use-admin';

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();
  const stats = data?.data;

  const cards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.users.total ?? '--',
      description: 'كل الأدوار',
      icon: Users,
    },
    {
      title: 'شحنات قيد التنفيذ',
      value: stats?.shipments.inTransit ?? '--',
      description: 'نشطة حالياً',
      icon: Package,
      variant: 'primary' as const,
    },
    {
      title: 'عروض قيد المراجعة',
      value: stats?.applications.pending ?? '--',
      description: 'طلبات النقل',
      icon: ClipboardList,
      variant: 'success' as const,
    },
    {
      title: 'شحنات جديدة',
      value: stats?.shipments.pending ?? '--',
      description: 'بانتظار الإجراء',
      icon: CheckSquare,
      variant: 'warning' as const,
    },
    {
      title: 'الشاحنات المتاحة',
      value: stats?.trucks.available ?? '--',
      description: 'جاهزة للعمل',
      icon: Truck,
    },
    {
      title: 'الشحنات المكتملة',
      value: stats?.shipments.delivered ?? '--',
      description: 'آخر فترة',
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم الإدارة</h1>
          <p className="text-muted-foreground">نظرة عامة على النشاط التشغيلي</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/approvals">طلبات التسجيل</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/shipments">إدارة الشحنات</Link>
          </Button>
        </div>
      </div>

      <StatsCards stats={cards} isLoading={isLoading} columns={3} />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>ملاحظة</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          لوحة الإدارة تحتاج إلى استكمال قسم تحليلات الإدارة وتفاصيل الشحنات في الصفحات
          المخصصة.
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل المستخدمين</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>التجار</span>
              <span className="font-semibold">{stats?.users.merchants ?? '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>أصحاب الشاحنات</span>
              <span className="font-semibold">{stats?.users.truckOwners ?? '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>السائقون</span>
              <span className="font-semibold">{stats?.users.drivers ?? '--'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>آخر الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity?.length ? (
              <ul className="space-y-3 text-sm">
                {stats.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-muted-foreground">{activity.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد أنشطة حديثة</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
