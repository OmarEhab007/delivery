'use client';

import { User, Building, Truck, Calendar, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { RegistrationRequest } from '@/types/admin';

interface ApprovalCardsProps {
  requests: RegistrationRequest[];
  isLoading?: boolean;
  onApprove?: (request: RegistrationRequest) => void;
  onReject?: (request: RegistrationRequest) => void;
  isApproving?: string | null;
}

const roleLabels: Record<string, string> = {
  Merchant: 'تاجر',
  TruckOwner: 'مالك شاحنة',
  Driver: 'سائق',
};

const roleIcons: Record<string, React.ElementType> = {
  Merchant: Building,
  TruckOwner: Truck,
  Driver: User,
};

const stateConfig: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: 'قيد المراجعة',
    color: 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
  },
  APPROVED: {
    label: 'مقبول',
    color: 'bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-300',
  },
  REJECTED: {
    label: 'مرفوض',
    color: 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  },
};

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function ApprovalCards({
  requests,
  isLoading = false,
  onApprove,
  onReject,
  isApproving = null,
}: ApprovalCardsProps) {
  if (isLoading) {
    return <ApprovalCardsSkeleton />;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">لا توجد طلبات</h3>
        <p className="text-muted-foreground">لا توجد طلبات تسجيل قيد المراجعة</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => {
        const RoleIcon = roleIcons[request.role] || User;
        const state = stateConfig[request.state] || stateConfig.PENDING;
        const isProcessing = isApproving === request._id;

        return (
          <Card key={request._id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <RoleIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{request.payload.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {roleLabels[request.role] || request.role}
                    </p>
                  </div>
                </div>
                <Badge className={state.color}>{state.label}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{request.payload.email}</span>
                </div>
                {request.payload.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{request.payload.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(request.createdAt)}</span>
                </div>
              </div>

              {/* Company Info (for merchants/truck owners) */}
              {request.payload.companyName && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">اسم الشركة</p>
                  <p className="font-medium">{request.payload.companyName}</p>
                </div>
              )}

              {/* Actions */}
              {request.state === 'PENDING' && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => onApprove?.(request)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'جاري...' : 'قبول'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => onReject?.(request)}
                    disabled={isProcessing}
                  >
                    رفض
                  </Button>
                </div>
              )}

              {/* Rejection reason */}
              {request.state === 'REJECTED' && request.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-xs text-red-600 dark:text-red-300">سبب الرفض:</p>
                  <p className="text-sm">{request.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ApprovalCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ApprovalCards;
