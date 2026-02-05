'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCards } from '@/components/shared/stats-cards';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { ExportButton } from '@/components/shared/export-button';
import {
  useKpiSummary,
  useStatusTrends,
  useRevenueAnalysis,
  usePerformanceMetrics,
  useCustomerInsights,
  useEfficiencyMetrics,
  useGeoAnalytics,
} from '@/hooks/use-analytics';
import { StatusTrendsChart } from '@/components/charts/status-trends-chart';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { CustomerInsightsChart } from '@/components/charts/customer-insights-chart';
import { EfficiencyChart } from '@/components/charts/efficiency-chart';
import { GeoChart } from '@/components/charts/geo-chart';
import { exportToCSV, exportToPDF, formatExportFilename } from '@/lib/export';
import { toast } from 'sonner';

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  // Fetch all analytics data
  const { data: kpiData, isLoading: kpiLoading } = useKpiSummary(dateRange);
  const { data: statusData, isLoading: statusLoading } = useStatusTrends(dateRange);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalysis(dateRange);
  const { data: performanceData, isLoading: performanceLoading } = usePerformanceMetrics(dateRange);
  const { data: customerData, isLoading: customerLoading } = useCustomerInsights(dateRange);
  const { data: efficiencyData, isLoading: efficiencyLoading } = useEfficiencyMetrics(dateRange);
  const { data: geoData, isLoading: geoLoading } = useGeoAnalytics(dateRange);

  const kpiSummary = kpiData?.data?.summary;

  // KPI Cards
  const cards = [
    {
      title: 'إجمالي الشحنات',
      value: kpiSummary?.totalShipments ?? '--',
      description: 'كل الشحنات',
      icon: BarChart3,
    },
    {
      title: 'الشحنات المسلمة',
      value: kpiSummary?.deliveredCount ?? '--',
      description: 'تم التسليم بنجاح',
      icon: TrendingUp,
      variant: 'success' as const,
    },
    {
      title: 'معدل التسليم في الوقت',
      value: kpiSummary?.onTimeRate
        ? `${(kpiSummary.onTimeRate * 100).toFixed(1)}%`
        : '--',
      description: 'التسليم في الموعد',
      icon: Clock,
      variant: 'primary' as const,
    },
    {
      title: 'متوسط وقت العبور',
      value: kpiSummary?.averageTransitHours
        ? `${kpiSummary.averageTransitHours.toFixed(1)} ساعة`
        : '--',
      description: 'متوسط المدة',
      icon: DollarSign,
    },
  ];

  const handleDateRangeChange = (startDate?: string, endDate?: string) => {
    setDateRange({ startDate, endDate });
  };

  const handleExport = async (format: 'csv' | 'pdf', chartType: string) => {
    try {
      switch (chartType) {
        case 'kpi':
          if (!kpiSummary) {
            toast.error('لا توجد بيانات للتصدير');
            return;
          }
          await exportKpiData(format, kpiSummary);
          break;
        case 'status':
          if (!statusData?.data) {
            toast.error('لا توجد بيانات للتصدير');
            return;
          }
          await exportStatusData(format, statusData.data);
          break;
        case 'revenue':
          if (!revenueData?.data) {
            toast.error('لا توجد بيانات للتصدير');
            return;
          }
          await exportRevenueData(format, revenueData.data);
          break;
        case 'performance':
          if (!performanceData?.data) {
            toast.error('لا توجد بيانات للتصدير');
            return;
          }
          await exportPerformanceData(format, performanceData.data);
          break;
        case 'customers':
          if (!customerData?.data) {
            toast.error('لا توجد بيانات للتصدير');
            return;
          }
          await exportCustomerData(format, customerData.data);
          break;
        case 'efficiency':
          if (!efficiencyData?.data) {
            toast.error('لا توجد بيانات للتصدير');
            return;
          }
          await exportEfficiencyData(format, efficiencyData.data);
          break;
        case 'geo':
          if (!geoData?.data) {
            toast.error('لا توجد بيانات للتصدير');
            return;
          }
          await exportGeoData(format, geoData.data);
          break;
        default:
          toast.error('نوع التصدير غير معروف');
          return;
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('فشل في تصدير البيانات');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">التحليلات المتقدمة</h1>
          <p className="text-muted-foreground">تقارير شاملة عن أداء النظام</p>
        </div>
        <DateRangeFilter onRangeChange={handleDateRangeChange} />
      </div>

      {/* KPI Summary Cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">مؤشرات الأداء الرئيسية</h2>
        <ExportButton onExport={(format) => handleExport(format, 'kpi')} disabled={!kpiSummary} />
      </div>
      <StatsCards stats={cards} isLoading={kpiLoading} columns={4} />

      {/* Charts Tabs */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-6">
          <TabsTrigger value="status">حالة الشحنات</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="customers">العملاء</TabsTrigger>
          <TabsTrigger value="efficiency">الكفاءة</TabsTrigger>
          <TabsTrigger value="geo">التحليل الجغرافي</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="flex items-center justify-end">
            <ExportButton
              onExport={(format) => handleExport(format, 'status')}
              disabled={!statusData?.data}
            />
          </div>
          <StatusTrendsChart data={statusData?.data} isLoading={statusLoading} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="flex items-center justify-end">
            <ExportButton
              onExport={(format) => handleExport(format, 'revenue')}
              disabled={!revenueData?.data}
            />
          </div>
          <RevenueChart data={revenueData?.data} isLoading={revenueLoading} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="flex items-center justify-end">
            <ExportButton
              onExport={(format) => handleExport(format, 'performance')}
              disabled={!performanceData?.data}
            />
          </div>
          <PerformanceChart data={performanceData?.data} isLoading={performanceLoading} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center justify-end">
            <ExportButton
              onExport={(format) => handleExport(format, 'customers')}
              disabled={!customerData?.data}
            />
          </div>
          <CustomerInsightsChart data={customerData?.data} isLoading={customerLoading} />
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <div className="flex items-center justify-end">
            <ExportButton
              onExport={(format) => handleExport(format, 'efficiency')}
              disabled={!efficiencyData?.data}
            />
          </div>
          <EfficiencyChart data={efficiencyData?.data} isLoading={efficiencyLoading} />
        </TabsContent>

        <TabsContent value="geo" className="space-y-4">
          <div className="flex items-center justify-end">
            <ExportButton
              onExport={(format) => handleExport(format, 'geo')}
              disabled={!geoData?.data}
            />
          </div>
          <GeoChart data={geoData?.data} isLoading={geoLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export helper functions
async function exportKpiData(
  format: 'csv' | 'pdf',
  data: {
    totalShipments: number;
    deliveredCount: number;
    onTimeRate: number;
    averageTransitHours: number;
    averageDelayHours?: number;
  }
) {
  const rows = [
    { metric: 'إجمالي الشحنات', value: data.totalShipments },
    { metric: 'الشحنات المسلمة', value: data.deliveredCount },
    { metric: 'معدل التسليم في الوقت', value: `${(data.onTimeRate * 100).toFixed(1)}%` },
    { metric: 'متوسط وقت العبور (ساعات)', value: data.averageTransitHours.toFixed(1) },
    { metric: 'متوسط التأخير (ساعات)', value: data.averageDelayHours?.toFixed(1) || '0' },
  ];

  if (format === 'csv') {
    exportToCSV(
      rows.map((r) => ({ المؤشر: r.metric, القيمة: r.value })),
      formatExportFilename('kpi-summary', 'csv')
    );
  } else {
    exportToPDF({
      title: 'ملخص مؤشرات الأداء الرئيسية',
      subtitle: 'نظرة عامة على أداء النظام',
      filename: formatExportFilename('kpi-summary', 'pdf'),
      sections: [
        {
          title: 'المؤشرات الرئيسية',
          columns: ['المؤشر', 'القيمة'],
          rows: rows.map((r) => ({ المؤشر: r.metric, القيمة: r.value })),
        },
      ],
    });
  }
}

async function exportStatusData(
  format: 'csv' | 'pdf',
  data: Array<{ period: string; statuses: Record<string, number> }>
) {
  if (data.length === 0) return;
  if (format === 'csv') {
    const rows = data.flatMap((item) =>
      Object.entries(item.statuses).map(([status, count]) => ({
        الفترة: item.period,
        الحالة: status,
        العدد: count,
      }))
    );
    exportToCSV(rows, formatExportFilename('status-trends', 'csv'));
  } else {
    const rows = data.map((item) => ({
      الفترة: item.period,
      ...item.statuses,
    }));
    exportToPDF({
      title: 'اتجاهات حالة الشحنات',
      subtitle: 'تطور حالات الشحنات عبر الزمن',
      filename: formatExportFilename('status-trends', 'pdf'),
      sections: [
        {
          title: 'البيانات',
          columns: ['الفترة', ...Object.keys(data[0]?.statuses || {})],
          rows,
        },
      ],
    });
  }
}

async function exportRevenueData(
  format: 'csv' | 'pdf',
  data: Array<{
    period: string;
    totalRevenue: number;
    shipmentCount: number;
    averageRevenuePerShipment: number;
  }>
) {
  if (data.length === 0) return;
  const rows = data.map((item) => ({
    الفترة: item.period,
    'إجمالي الإيرادات': item.totalRevenue,
    'عدد الشحنات': item.shipmentCount,
    'متوسط الإيرادات لكل شحنة': item.averageRevenuePerShipment.toFixed(2),
  }));

  if (format === 'csv') {
    exportToCSV(rows, formatExportFilename('revenue-analysis', 'csv'));
  } else {
    exportToPDF({
      title: 'تحليل الإيرادات',
      subtitle: 'الإيرادات وعدد الشحنات عبر الزمن',
      filename: formatExportFilename('revenue-analysis', 'pdf'),
      sections: [{ title: 'البيانات', columns: Object.keys(rows[0]), rows }],
    });
  }
}

async function exportPerformanceData(
  format: 'csv' | 'pdf',
  data: Array<{
    _id: string;
    driverName?: string;
    driverEmail?: string;
    totalShipments: number;
    totalDistance: number;
    averageRating: number;
    onTimeDeliveryRate: number;
  }>
) {
  if (data.length === 0) return;
  const rows = data.map((item) => ({
    'اسم السائق': item.driverName || item._id,
    'البريد الإلكتروني': item.driverEmail || '-',
    'إجمالي الشحنات': item.totalShipments,
    'إجمالي المسافة': item.totalDistance.toFixed(1),
    'معدل التقييم': item.averageRating.toFixed(1),
    'معدل التسليم في الوقت': `${(item.onTimeDeliveryRate * 100).toFixed(1)}%`,
  }));

  if (format === 'csv') {
    exportToCSV(rows, formatExportFilename('performance-metrics', 'csv'));
  } else {
    exportToPDF({
      title: 'مقاييس الأداء',
      subtitle: 'أداء السائقين والشاحنات',
      filename: formatExportFilename('performance-metrics', 'pdf'),
      sections: [{ title: 'البيانات', columns: Object.keys(rows[0]), rows }],
    });
  }
}

async function exportCustomerData(
  format: 'csv' | 'pdf',
  data: Array<{
    merchantName: string;
    merchantEmail: string;
    totalShipments: number;
    totalRevenue: number;
    avgOrderValue: number;
    daysSinceLastOrder: number;
  }>
) {
  if (data.length === 0) return;
  const rows = data.map((item) => ({
    'اسم العميل': item.merchantName,
    'البريد الإلكتروني': item.merchantEmail,
    'عدد الشحنات': item.totalShipments,
    'إجمالي الإيرادات': item.totalRevenue,
    'متوسط قيمة الطلب': item.avgOrderValue.toFixed(2),
    'أيام منذ آخر طلب': item.daysSinceLastOrder,
  }));

  if (format === 'csv') {
    exportToCSV(rows, formatExportFilename('customer-insights', 'csv'));
  } else {
    exportToPDF({
      title: 'رؤى العملاء',
      subtitle: 'أفضل العملاء حسب الإيرادات والشحنات',
      filename: formatExportFilename('customer-insights', 'pdf'),
      sections: [{ title: 'البيانات', columns: Object.keys(rows[0]), rows }],
    });
  }
}

async function exportEfficiencyData(
  format: 'csv' | 'pdf',
  data: Array<{
    period: string;
    totalShipments: number;
    completedShipments: number;
    cancelledShipments: number;
    delayedShipments: number;
    completionRate: number;
    cancellationRate: number;
    delayRate: number;
    avgDeliveryTime: number;
  }>
) {
  if (data.length === 0) return;
  const rows = data.map((item) => ({
    الفترة: item.period,
    'إجمالي الشحنات': item.totalShipments,
    'الشحنات المكتملة': item.completedShipments,
    'الشحنات الملغاة': item.cancelledShipments,
    'الشحنات المتأخرة': item.delayedShipments,
    'معدل الإنجاز': `${(item.completionRate * 100).toFixed(1)}%`,
    'معدل الإلغاء': `${(item.cancellationRate * 100).toFixed(1)}%`,
    'معدل التأخير': `${(item.delayRate * 100).toFixed(1)}%`,
    'متوسط وقت التسليم': item.avgDeliveryTime.toFixed(1),
  }));

  if (format === 'csv') {
    exportToCSV(rows, formatExportFilename('efficiency-metrics', 'csv'));
  } else {
    exportToPDF({
      title: 'مقاييس الكفاءة',
      subtitle: 'معدلات الإنجاز والإلغاء والتأخير',
      filename: formatExportFilename('efficiency-metrics', 'pdf'),
      sections: [{ title: 'البيانات', columns: Object.keys(rows[0]), rows }],
    });
  }
}

async function exportGeoData(
  format: 'csv' | 'pdf',
  data: Array<{
    origin: string;
    destination: string;
    shipmentCount: number;
    totalRevenue: number;
    averageTravelTime: number;
  }>
) {
  if (data.length === 0) return;
  const rows = data.map((item) => ({
    الأصل: item.origin,
    الوجهة: item.destination,
    'عدد الشحنات': item.shipmentCount,
    'إجمالي الإيرادات': item.totalRevenue,
    'متوسط وقت السفر (ساعات)': item.averageTravelTime.toFixed(1),
  }));

  if (format === 'csv') {
    exportToCSV(rows, formatExportFilename('geo-analytics', 'csv'));
  } else {
    exportToPDF({
      title: 'التحليل الجغرافي',
      subtitle: 'أداء المسارات حسب الوجهة والأصل',
      filename: formatExportFilename('geo-analytics', 'pdf'),
      sections: [{ title: 'البيانات', columns: Object.keys(rows[0]), rows }],
    });
  }
}
