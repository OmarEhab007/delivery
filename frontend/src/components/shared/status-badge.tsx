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
  PENDING_APPROVAL: { label: 'في انتظار الموافقة', variant: 'outline', className: 'border-yellow-500 text-yellow-600 bg-yellow-50' },
  REQUESTED: { label: 'مطلوبة', variant: 'secondary' },
  CONFIRMED: { label: 'مؤكدة', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  ASSIGNED: { label: 'تم التعيين', variant: 'default', className: 'bg-indigo-500 hover:bg-indigo-600' },
  LOADING: { label: 'جاري التحميل', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
  IN_TRANSIT: { label: 'في الطريق', variant: 'default', className: 'bg-primary hover:bg-primary/90' },
  UNLOADING: { label: 'جاري التفريغ', variant: 'default', className: 'bg-teal-500 hover:bg-teal-600' },
  AT_BORDER: { label: 'عند الحدود', variant: 'outline', className: 'border-orange-500 text-orange-600 bg-orange-50' },
  DELIVERED: { label: 'تم التسليم', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  COMPLETED: { label: 'مكتملة', variant: 'default', className: 'bg-green-600 hover:bg-green-700' },
  CANCELLED: { label: 'ملغاة', variant: 'destructive' },
  DELAYED: { label: 'متأخرة', variant: 'outline', className: 'border-red-500 text-red-600 bg-red-50' },
  REJECTED: { label: 'مرفوضة', variant: 'destructive' },
};

// Application Status Configurations
const applicationStatusConfig: Record<ApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  PENDING: { label: 'قيد المراجعة', variant: 'outline', className: 'border-yellow-500 text-yellow-600 bg-yellow-50' },
  ACCEPTED: { label: 'مقبول', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  REJECTED: { label: 'مرفوض', variant: 'destructive' },
  CANCELLED: { label: 'ملغي', variant: 'secondary' },
};

// Truck Status Configurations
const truckStatusConfig: Record<TruckStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  AVAILABLE: { label: 'متاحة', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  IN_SERVICE: { label: 'في الخدمة', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  IN_MAINTENANCE: { label: 'صيانة', variant: 'outline', className: 'border-orange-500 text-orange-600 bg-orange-50' },
  OUT_OF_SERVICE: { label: 'خارج الخدمة', variant: 'destructive' },
};

// Approval Status Configurations
const approvalStatusConfig: Record<ApprovalStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  PENDING: { label: 'قيد الانتظار', variant: 'outline', className: 'border-yellow-500 text-yellow-600 bg-yellow-50' },
  APPROVED: { label: 'معتمد', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  REJECTED: { label: 'مرفوض', variant: 'destructive' },
};

// Driver Status Configurations
const driverStatusConfig: Record<DriverStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  ACTIVE: { label: 'نشط', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  OFF_DUTY: { label: 'خارج الخدمة', variant: 'secondary' },
  ON_BREAK: { label: 'في استراحة', variant: 'outline', className: 'border-blue-500 text-blue-600 bg-blue-50' },
  INACTIVE: { label: 'غير نشط', variant: 'destructive' },
};

// Verification Status Configurations
const verificationStatusConfig: Record<VerificationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  UNVERIFIED: { label: 'غير موثق', variant: 'secondary' },
  PENDING: { label: 'قيد التوثيق', variant: 'outline', className: 'border-yellow-500 text-yellow-600 bg-yellow-50' },
  VERIFIED: { label: 'موثق', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
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
