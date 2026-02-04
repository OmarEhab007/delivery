'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, Coffee, Power, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { DriverStatus } from '@/types/api';

interface DriverStatusToggleProps {
  currentStatus?: DriverStatus;
  onStatusChange: (status: DriverStatus) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
}

const statusConfig: Record<DriverStatus, { label: string; icon: typeof Clock; color: string }> = {
  ACTIVE: {
    label: 'نشط',
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30',
  },
  OFF_DUTY: {
    label: 'خارج العمل',
    icon: Power,
    color: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800/40',
  },
  ON_BREAK: {
    label: 'في استراحة',
    icon: Coffee,
    color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30',
  },
  INACTIVE: {
    label: 'غير نشط',
    icon: Power,
    color: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
  },
};

export function DriverStatusToggle({
  currentStatus = 'OFF_DUTY',
  onStatusChange,
  disabled = false,
  isLoading = false,
}: DriverStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = statusConfig[currentStatus] || statusConfig.OFF_DUTY;
  const StatusIcon = currentConfig.icon;

  const handleStatusChange = async (status: DriverStatus) => {
    if (status === currentStatus) return;
    setIsOpen(false);
    await onStatusChange(status);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[140px] justify-start gap-2"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <StatusIcon className={`h-4 w-4 ${currentConfig.color.split(' ')[0]}`} />
          )}
          <span>{currentConfig.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem
          onClick={() => handleStatusChange('ACTIVE')}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span>نشط</span>
          {currentStatus === 'ACTIVE' && (
            <CheckCircle2 className="h-4 w-4 mr-auto" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange('ON_BREAK')}
          className="gap-2"
        >
          <Coffee className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span>في استراحة</span>
          {currentStatus === 'ON_BREAK' && (
            <CheckCircle2 className="h-4 w-4 mr-auto" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleStatusChange('OFF_DUTY')}
          className="gap-2"
        >
          <Power className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span>خارج العمل</span>
          {currentStatus === 'OFF_DUTY' && (
            <CheckCircle2 className="h-4 w-4 mr-auto" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DriverStatusBadge({ status }: { status?: DriverStatus }) {
  if (!status) return null;

  const config = statusConfig[status] || statusConfig.OFF_DUTY;
  const StatusIcon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 ${config.color}`}>
      <StatusIcon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default DriverStatusToggle;
