'use client';

import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  lastUpdate?: Date | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<
  ConnectionStatus,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    bgColor: string;
    animate?: boolean;
  }
> = {
  connecting: {
    icon: Loader2,
    label: 'جاري الاتصال...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    animate: true,
  },
  connected: {
    icon: Wifi,
    label: 'متصل',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  disconnected: {
    icon: WifiOff,
    label: 'غير متصل',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  error: {
    icon: AlertCircle,
    label: 'خطأ في الاتصال',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
};

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    container: 'h-6 px-2 text-xs',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    icon: 'h-4 w-4',
    container: 'h-8 px-3 text-sm',
    dot: 'h-2 w-2',
  },
  lg: {
    icon: 'h-5 w-5',
    container: 'h-10 px-4 text-base',
    dot: 'h-2.5 w-2.5',
  },
};

function formatLastUpdate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 10) return 'الآن';
  if (diffSec < 60) return `منذ ${diffSec} ثانية`;
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  return date.toLocaleTimeString('ar-SA');
}

export function ConnectionStatusIndicator({
  status,
  lastUpdate,
  showLabel = true,
  size = 'md',
  className,
}: ConnectionStatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const indicator = (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        config.bgColor,
        sizes.container,
        className
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          'rounded-full',
          sizes.dot,
          status === 'connected' && 'bg-green-500',
          status === 'connecting' && 'bg-yellow-500 animate-pulse',
          status === 'disconnected' && 'bg-gray-400',
          status === 'error' && 'bg-red-500'
        )}
      />

      {/* Icon */}
      <Icon
        className={cn(
          sizes.icon,
          config.color,
          config.animate && 'animate-spin'
        )}
      />

      {/* Label */}
      {showLabel && (
        <span className={cn('font-medium', config.color)}>{config.label}</span>
      )}
    </div>
  );

  if (lastUpdate && status === 'connected') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{indicator}</TooltipTrigger>
          <TooltipContent>
            <p>آخر تحديث: {formatLastUpdate(lastUpdate)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return indicator;
}

// Minimal dot-only indicator
export function ConnectionStatusDot({
  status,
  size = 'md',
  className,
}: {
  status: ConnectionStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = sizeConfig[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'rounded-full',
              sizes.dot,
              status === 'connected' && 'bg-green-500',
              status === 'connecting' && 'bg-yellow-500 animate-pulse',
              status === 'disconnected' && 'bg-gray-400',
              status === 'error' && 'bg-red-500',
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusConfig[status].label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Live indicator with pulse animation
export function LiveIndicator({
  isLive = true,
  label = 'مباشر',
  className,
}: {
  isLive?: boolean;
  label?: string;
  className?: string;
}) {
  if (!isLive) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span className="text-xs font-medium text-green-600">{label}</span>
    </div>
  );
}

export default ConnectionStatusIndicator;
