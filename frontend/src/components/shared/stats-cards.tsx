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
  primary: 'bg-primary/10 text-foreground border-primary/25',
  success: 'bg-emerald-500/10 text-foreground border-emerald-500/20',
  warning: 'bg-amber-500/10 text-foreground border-amber-500/20',
  danger: 'bg-rose-500/10 text-foreground border-rose-500/20',
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
    <Card
      className={cn(
        'relative overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg',
        variantStyles[variant]
      )}
    >
      <div className="absolute -right-8 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {stat.title}
        </CardTitle>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/80',
              variant !== 'default' && 'border-transparent bg-background/80'
            )}
          >
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-semibold">{stat.value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {stat.trend && (
            <span
              className={cn(
                'font-medium',
                stat.trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
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
