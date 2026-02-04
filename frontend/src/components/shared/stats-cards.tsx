'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface StatCardData {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

interface StatsCardsProps {
  stats: StatCardData[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

const variantStyles = {
  default: 'bg-card text-card-foreground',
  primary: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20',
  success:
    'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  warning:
    'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
};

function StatCardSkeleton() {
  return (
    <Card className="border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = stat.icon;
  const variant = stat.variant || 'default';

  return (
    <Card className={cn('border transition-all hover:shadow-md', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {stat.title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            variant === 'default' ? 'bg-primary/10 text-primary' : 'bg-current/10'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {stat.trend && (
            <span
              className={cn(
                'font-medium',
                stat.trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
            </span>
          )}
          {stat.description && <span>{stat.description}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({
  stats,
  isLoading = false,
  columns = 4,
  className,
}: StatsCardsProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 grid-cols-1', gridCols[columns], className)}>
        {Array.from({ length: columns }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 grid-cols-1', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} />
      ))}
    </div>
  );
}

export default StatsCards;
