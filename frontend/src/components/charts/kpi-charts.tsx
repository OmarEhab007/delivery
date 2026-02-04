'use client';

import {
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  DollarSign,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Types for KPI data
interface LanePerformance {
  origin: string;
  destination: string;
  shipmentCount: number;
  averageCost: number;
  averageTime: number;
}

interface MerchantKPIs {
  totalShipments: number;
  completedShipments: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  totalSpend: number;
  lanePerformance: LanePerformance[];
}

interface KPIChartsProps {
  data?: MerchantKPIs;
  isLoading?: boolean;
}

function formatCurrency(amount: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatHours(hours: number) {
  if (hours < 24) return `${hours.toFixed(0)} ساعة`;
  const days = hours / 24;
  return `${days.toFixed(1)} يوم`;
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function KPICard({ title, value, description, icon: Icon, trend, variant = 'default' }: KPICardProps) {
  const variantColors = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600',
    warning: 'bg-yellow-500/10 text-yellow-600',
    danger: 'bg-red-500/10 text-red-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', variantColors[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {trend && (
            <span
              className={cn(
                'flex items-center font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 ml-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 ml-0.5" />
              )}
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPIOverviewCards({ data, isLoading }: KPIChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const completionRate = data.totalShipments > 0
    ? (data.completedShipments / data.totalShipments) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="إجمالي الشحنات"
        value={data.totalShipments}
        description="جميع الشحنات"
        icon={Package}
        variant="default"
      />
      <KPICard
        title="الشحنات المكتملة"
        value={data.completedShipments}
        description={`${formatPercentage(completionRate)} معدل الإتمام`}
        icon={CheckCircle2}
        variant="success"
      />
      <KPICard
        title="متوسط وقت التسليم"
        value={formatHours(data.averageDeliveryTime)}
        description="من الاستلام للتسليم"
        icon={Clock}
        variant={data.averageDeliveryTime > 72 ? 'warning' : 'default'}
      />
      <KPICard
        title="معدل التسليم في الوقت"
        value={formatPercentage(data.onTimeDeliveryRate)}
        description="تم تسليمه في الموعد"
        icon={Truck}
        variant={data.onTimeDeliveryRate >= 90 ? 'success' : data.onTimeDeliveryRate >= 70 ? 'warning' : 'danger'}
      />
    </div>
  );
}

export function TotalSpendCard({ data, isLoading }: KPIChartsProps) {
  if (isLoading) {
    return <KPICardSkeleton />;
  }

  if (!data) return null;

  return (
    <KPICard
      title="إجمالي الإنفاق"
      value={formatCurrency(data.totalSpend)}
      description="على جميع الشحنات"
      icon={DollarSign}
      variant="default"
    />
  );
}

export function LanePerformanceTable({ data, isLoading }: KPIChartsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.lanePerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>أداء المسارات</CardTitle>
          <CardDescription>إحصائيات المسارات الأكثر استخداماً</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-8">
            لا توجد بيانات كافية لعرض أداء المسارات
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by shipment count descending
  const sortedLanes = [...data.lanePerformance].sort(
    (a, b) => b.shipmentCount - a.shipmentCount
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>أداء المسارات</CardTitle>
        <CardDescription>إحصائيات المسارات الأكثر استخداماً</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedLanes.slice(0, 5).map((lane, index) => {
            const maxCount = sortedLanes[0].shipmentCount;
            const percentage = (lane.shipmentCount / maxCount) * 100;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lane.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{lane.destination}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {lane.shipmentCount} شحنة
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>متوسط: {formatCurrency(lane.averageCost)}</span>
                    <span>{formatHours(lane.averageTime)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Combined KPI Dashboard component
export function KPIDashboard({ data, isLoading }: KPIChartsProps) {
  return (
    <div className="space-y-6">
      <KPIOverviewCards data={data} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LanePerformanceTable data={data} isLoading={isLoading} />
        </div>
        <div>
          <TotalSpendCard data={data} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default KPIDashboard;
