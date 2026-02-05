'use client';

import { BarChart3, TrendingUp, Users, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '@/components/shared/stats-cards';
import { useAdminDashboard } from '@/hooks/use-admin';
import { ExportButton } from '@/components/shared/export-button';
import { exportToCSV, exportToPDF, formatExportFilename, type PdfSection } from '@/lib/export';
import { toast } from 'sonner';

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

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!stats) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    const summaryRows = [
      { metric: 'إجمالي الشحنات', value: stats.shipments.total },
      { metric: 'الشحنات النشطة', value: stats.shipments.inTransit },
      { metric: 'إجمالي المستخدمين', value: stats.users.total },
      { metric: 'الشاحنات المتاحة', value: stats.trucks.available },
      { metric: 'الطلبات المعلقة', value: stats.applications.pending },
    ];

    if (format === 'csv') {
      const rows = summaryRows.map((row) => ({
        المؤشر: row.metric,
        القيمة: row.value,
      }));
      exportToCSV(rows, formatExportFilename('admin-analytics', 'csv'));
      return;
    }

    const sections: PdfSection[] = [
      {
        title: 'ملخص مؤشرات النظام',
        columns: ['المؤشر', 'القيمة'],
        rows: summaryRows.map((row) => ({ المؤشر: row.metric, القيمة: row.value })),
      },
    ];

    exportToPDF({
      title: 'تقرير تحليلات الإدارة',
      subtitle: 'نظرة عامة على مؤشرات الأداء الرئيسية للنظام.',
      filename: formatExportFilename('admin-analytics', 'pdf'),
      sections,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">التحليلات</h1>
          <p className="text-muted-foreground">مؤشرات الأداء العامة للنظام</p>
        </div>
        <ExportButton onExport={handleExport} disabled={!stats} />
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
