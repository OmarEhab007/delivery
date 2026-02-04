'use client';

import {
  Users,
  Package,
  Truck,
  FileText,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface AdminStat {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

interface AdminStatsCardsProps {
  stats: AdminStat[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4 | 6;
}

const variantStyles: Record<string, { bg: string; icon: string }> = {
  default: { bg: '', icon: 'text-muted-foreground' },
  primary: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400' },
  success: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400' },
  warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-600 dark:text-yellow-400' },
  danger: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600 dark:text-red-400' },
};

const defaultIcons: Record<string, LucideIcon> = {
  users: Users,
  shipments: Package,
  trucks: Truck,
  documents: FileText,
  applications: ClipboardList,
};

export function AdminStatsCards({
  stats,
  isLoading = false,
  columns = 4,
}: AdminStatsCardsProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
    6: 'md:grid-cols-3 lg:grid-cols-6',
  };

  if (isLoading) {
    return <AdminStatsCardsSkeleton count={stats.length || 4} columns={columns} />;
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {stats.map((stat, index) => {
        const variant = variantStyles[stat.variant || 'default'];
        const Icon = stat.icon || defaultIcons.users;

        return (
          <Card key={index} className={cn(variant.bg)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={cn('h-4 w-4', variant.icon)} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.trend && (
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      stat.trend.type === 'increase' && 'text-green-600 dark:text-green-400',
                      stat.trend.type === 'decrease' && 'text-red-600 dark:text-red-400',
                      stat.trend.type === 'neutral' && 'text-muted-foreground'
                    )}
                  >
                    {stat.trend.type === 'increase' && (
                      <TrendingUp className="h-3 w-3 ml-1" />
                    )}
                    {stat.trend.type === 'decrease' && (
                      <TrendingDown className="h-3 w-3 ml-1" />
                    )}
                    {stat.trend.value > 0 ? '+' : ''}
                    {stat.trend.value}%
                  </span>
                )}
              </div>
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AdminStatsCardsSkeleton({
  count,
  columns,
}: {
  count: number;
  columns: number;
}) {
  const gridCols: Record<number, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
    6: 'md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {[...Array(count)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Pre-configured admin dashboard stats
export function AdminDashboardStats({
  data,
  isLoading,
}: {
  data?: {
    users: { total: number; merchants: number; truckOwners: number; drivers: number };
    shipments: { pending: number; inTransit: number; delivered: number };
    applications: { pending: number };
    trucks: { available: number };
  };
  isLoading?: boolean;
}) {
  const stats: AdminStat[] = [
    {
      title: 'إجمالي المستخدمين',
      value: data?.users.total ?? '--',
      description: 'كل الأدوار',
      icon: Users,
    },
    {
      title: 'شحنات قيد التنفيذ',
      value: data?.shipments.inTransit ?? '--',
      description: 'نشطة حالياً',
      icon: Package,
      variant: 'primary',
    },
    {
      title: 'عروض قيد المراجعة',
      value: data?.applications.pending ?? '--',
      description: 'طلبات النقل',
      icon: ClipboardList,
      variant: 'success',
    },
    {
      title: 'شحنات جديدة',
      value: data?.shipments.pending ?? '--',
      description: 'بانتظار الإجراء',
      icon: Package,
      variant: 'warning',
    },
    {
      title: 'الشاحنات المتاحة',
      value: data?.trucks.available ?? '--',
      description: 'جاهزة للعمل',
      icon: Truck,
    },
    {
      title: 'الشحنات المكتملة',
      value: data?.shipments.delivered ?? '--',
      description: 'آخر فترة',
      icon: Package,
    },
  ];

  return <AdminStatsCards stats={stats} isLoading={isLoading} columns={3} />;
}

export default AdminStatsCards;
