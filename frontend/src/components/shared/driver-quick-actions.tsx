'use client';

import Link from 'next/link';
import {
  Package,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DriverQuickActionsProps {
  hasActiveShipment?: boolean;
  activeShipmentId?: string;
  canStartDelivery?: boolean;
  canCompleteDelivery?: boolean;
  onStartDelivery?: () => void;
  onCompleteDelivery?: () => void;
  onReportIssue?: () => void;
}

export function DriverQuickActions({
  hasActiveShipment = false,
  activeShipmentId,
  canStartDelivery = false,
  canCompleteDelivery = false,
  onStartDelivery,
  onCompleteDelivery,
  onReportIssue,
}: DriverQuickActionsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* View Shipments */}
      <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
        <Link href="/driver/shipments">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">الشحنات</h3>
              <p className="text-sm text-muted-foreground">
                عرض الشحنات المعينة
              </p>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Start Delivery */}
      {canStartDelivery && activeShipmentId ? (
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-green-500/50 border-green-500/20 bg-green-50/50 dark:bg-green-950/20"
          onClick={onStartDelivery}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-400">بدء التسليم</h3>
              <p className="text-sm text-green-600/70">
                ابدأ رحلة التسليم
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="opacity-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">بدء التسليم</h3>
              <p className="text-sm text-muted-foreground">
                لا توجد شحنة جاهزة
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Delivery */}
      {canCompleteDelivery && activeShipmentId ? (
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-blue-500/50 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"
          onClick={onCompleteDelivery}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">إتمام التسليم</h3>
              <p className="text-sm text-blue-600/70">
                تأكيد وصول الشحنة
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="opacity-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">إتمام التسليم</h3>
              <p className="text-sm text-muted-foreground">
                لا يوجد تسليم قيد التنفيذ
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Issue */}
      {hasActiveShipment ? (
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-orange-500/50"
          onClick={onReportIssue}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">الإبلاغ عن مشكلة</h3>
              <p className="text-sm text-muted-foreground">
                تسجيل مشكلة أو تأخير
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          <Link href="/driver/history">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">السجل</h3>
                <p className="text-sm text-muted-foreground">
                  عرض سجل التسليمات
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      )}
    </div>
  );
}

export default DriverQuickActions;
