'use client';

import Link from 'next/link';
import { Package, Plus, TrendingUp, Clock, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '@/components/shared/stats-cards';
import { PortalHero } from '@/components/shared/portal-hero';
import { ShipmentsTable } from '@/components/tables/shipments-table';
import { useShipments } from '@/hooks/use-shipments';

export default function MerchantDashboardPage() {
  const { data: shipmentsData, isLoading: shipmentsLoading } = useShipments({
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const shipments = shipmentsData?.data || [];
  const pagination = shipmentsData?.pagination;

  // Calculate stats
  const totalShipments = pagination?.total || 0;
  const activeShipments = shipments.filter(
    (s) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(s.status)
  ).length;
  const pendingBids = shipments.filter(
    (s) => s.status === 'REQUESTED' && s.pricingType === 'BIDDING'
  ).length;
  const completedThisMonth = shipments.filter((s) => {
    if (s.status !== 'COMPLETED') return false;
    const completedDate = new Date(s.updatedAt);
    const now = new Date();
    return (
      completedDate.getMonth() === now.getMonth() &&
      completedDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const stats = [
    {
      title: 'إجمالي الشحنات',
      value: totalShipments,
      description: 'جميع الشحنات',
      icon: Package,
    },
    {
      title: 'شحنات نشطة',
      value: activeShipments,
      description: 'قيد التنفيذ',
      icon: TrendingUp,
      variant: 'primary' as const,
    },
    {
      title: 'عروض في الانتظار',
      value: pendingBids,
      description: 'تحتاج مراجعة',
      icon: Clock,
      variant: 'warning' as const,
    },
    {
      title: 'مكتملة هذا الشهر',
      value: completedThisMonth,
      description: 'تم التسليم',
      icon: CheckCircle2,
      variant: 'success' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PortalHero
        title="مرحباً بك في لوحة التاجر"
        subtitle="تاجر أو عميل"
        description="تابع شحناتك، واطّلع على العروض، وأنجز المستندات بسهولة."
        imageSrc="/brand/merchant-hero.png"
        actionLabel="شحنة جديدة"
        actionHref="/merchant/shipments/new"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">
            مرحباً بك، إليك ملخص شحناتك
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/merchant/analytics">
              <FileText className="ml-2 h-4 w-4" />
              التقارير
            </Link>
          </Button>
          <Button asChild>
            <Link href="/merchant/shipments/new">
              <Plus className="ml-2 h-4 w-4" />
              شحنة جديدة
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={shipmentsLoading} />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          <Link href="/merchant/shipments/new">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">إنشاء شحنة جديدة</h3>
                <p className="text-sm text-muted-foreground">
                  ابدأ بطلب شحنة جديدة
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          <Link href="/merchant/shipments?status=REQUESTED">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">مراجعة العروض</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingBids} عرض في الانتظار
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          <Link href="/merchant/shipments?status=IN_TRANSIT">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">تتبع الشحنات</h3>
                <p className="text-sm text-muted-foreground">
                  متابعة الشحنات النشطة
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Shipments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>أحدث الشحنات</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/merchant/shipments">عرض الكل</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ShipmentsTable
            shipments={shipments}
            isLoading={shipmentsLoading}
            baseUrl="/merchant/shipments"
            emptyMessage="لا توجد شحنات بعد. أنشئ شحنتك الأولى!"
          />
        </CardContent>
      </Card>
    </div>
  );
}
