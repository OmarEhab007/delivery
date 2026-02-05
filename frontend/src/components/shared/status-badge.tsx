'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  ShipmentStatus,
  ApplicationStatus,
  TruckStatus,
  ApprovalStatus,
  DriverStatus,
  VerificationStatus,
} from '@/types/api';

// Shipment Status Configurations
const shipmentStatusConfig: Record<ShipmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  PENDING_APPROVAL: {
    label: 'في انتظار الموافقة',
    variant: 'outline',
    className:
      'border-amber-500/40 text-amber-700 bg-amber-500/15 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200',
  },
  REQUESTED: { label: 'مطلوبة', variant: 'secondary' },
  CONFIRMED: { label: 'مؤكدة', variant: 'outline', className: 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-200' },
  ASSIGNED: { label: 'تم التعيين', variant: 'outline', className: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-200' },
  LOADING: { label: 'جاري التحميل', variant: 'outline', className: 'border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-200' },
  IN_TRANSIT: { label: 'في الطريق', variant: 'outline', className: 'border-primary/40 bg-primary/15 text-primary' },
  UNLOADING: { label: 'جاري التفريغ', variant: 'outline', className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' },
  AT_BORDER: {
    label: 'عند الحدود',
    variant: 'outline',
    className:
      'border-orange-500/40 text-orange-700 bg-orange-500/15 dark:border-orange-400/40 dark:bg-orange-500/15 dark:text-orange-200',
  },
  DELIVERED: { label: 'تم التسليم', variant: 'outline', className: 'border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-200' },
  COMPLETED: { label: 'مكتملة', variant: 'outline', className: 'border-green-600/40 bg-green-600/15 text-green-700 dark:text-green-200' },
  CANCELLED: { label: 'ملغاة', variant: 'destructive' },
  DELAYED: {
    label: 'متأخرة',
    variant: 'outline',
    className:
      'border-rose-500/40 text-rose-700 bg-rose-500/15 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200',
  },
  REJECTED: { label: 'مرفوضة', variant: 'destructive' },
};

// Application Status Configurations
const applicationStatusConfig: Record<ApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  PENDING: {
    label: 'قيد المراجعة',
    variant: 'outline',
    className:
      'border-amber-500/40 text-amber-700 bg-amber-500/15 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200',
  },
  ACCEPTED: { label: 'مقبول', variant: 'outline', className: 'border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-200' },
  REJECTED: { label: 'مرفوض', variant: 'destructive' },
  CANCELLED: { label: 'ملغي', variant: 'secondary' },
};

// Truck Status Configurations
const truckStatusConfig: Record<TruckStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  AVAILABLE: { label: 'متاحة', variant: 'outline', className: 'border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-200' },
  IN_SERVICE: { label: 'في الخدمة', variant: 'outline', className: 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-200' },
  IN_MAINTENANCE: {
    label: 'صيانة',
    variant: 'outline',
    className:
      'border-orange-500/40 text-orange-700 bg-orange-500/15 dark:border-orange-400/40 dark:bg-orange-500/15 dark:text-orange-200',
  },
  OUT_OF_SERVICE: { label: 'خارج الخدمة', variant: 'destructive' },
};

// Approval Status Configurations
const approvalStatusConfig: Record<ApprovalStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  PENDING: {
    label: 'قيد الانتظار',
    variant: 'outline',
    className:
      'border-amber-500/40 text-amber-700 bg-amber-500/15 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200',
  },
  APPROVED: { label: 'معتمد', variant: 'outline', className: 'border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-200' },
  REJECTED: { label: 'مرفوض', variant: 'destructive' },
};

// Driver Status Configurations
const driverStatusConfig: Record<DriverStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  ACTIVE: { label: 'نشط', variant: 'outline', className: 'border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-200' },
  OFF_DUTY: { label: 'خارج الخدمة', variant: 'secondary' },
  ON_BREAK: {
    label: 'في استراحة',
    variant: 'outline',
    className:
      'border-sky-500/40 text-sky-700 bg-sky-500/15 dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-200',
  },
  INACTIVE: { label: 'غير نشط', variant: 'destructive' },
};

// Verification Status Configurations
const verificationStatusConfig: Record<VerificationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  UNVERIFIED: { label: 'غير موثق', variant: 'secondary' },
  PENDING: {
    label: 'قيد التوثيق',
    variant: 'outline',
    className:
      'border-amber-500/40 text-amber-700 bg-amber-500/15 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200',
  },
  VERIFIED: { label: 'موثق', variant: 'outline', className: 'border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-200' },
  REJECTED: { label: 'مرفوض', variant: 'destructive' },
};

interface StatusBadgeProps {
  status: string;
  type: 'shipment' | 'application' | 'truck' | 'approval' | 'driver' | 'verification';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, type, size = 'md', className }: StatusBadgeProps) {
  let config: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string } | undefined;

  switch (type) {
    case 'shipment':
      config = shipmentStatusConfig[status as ShipmentStatus];
      break;
    case 'application':
      config = applicationStatusConfig[status as ApplicationStatus];
      break;
    case 'truck':
      config = truckStatusConfig[status as TruckStatus];
      break;
    case 'approval':
      config = approvalStatusConfig[status as ApprovalStatus];
      break;
    case 'driver':
      config = driverStatusConfig[status as DriverStatus];
      break;
    case 'verification':
      config = verificationStatusConfig[status as VerificationStatus];
      break;
  }

  if (!config) {
    config = { label: status, variant: 'secondary' };
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

// Export individual status components for convenience
export function ShipmentStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type' | 'status'> & { status: ShipmentStatus }) {
  return <StatusBadge status={status} type="shipment" {...props} />;
}

export function ApplicationStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type' | 'status'> & { status: ApplicationStatus }) {
  return <StatusBadge status={status} type="application" {...props} />;
}

export function TruckStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type' | 'status'> & { status: TruckStatus }) {
  return <StatusBadge status={status} type="truck" {...props} />;
}

export function ApprovalStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type' | 'status'> & { status: ApprovalStatus }) {
  return <StatusBadge status={status} type="approval" {...props} />;
}

export function DriverStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type' | 'status'> & { status: DriverStatus }) {
  return <StatusBadge status={status} type="driver" {...props} />;
}

export function VerificationStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type' | 'status'> & { status: VerificationStatus }) {
  return <StatusBadge status={status} type="verification" {...props} />;
}

export default StatusBadge;
