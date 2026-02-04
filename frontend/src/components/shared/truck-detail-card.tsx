'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Truck as TruckIcon,
  User,
  Calendar,
  Fuel,
  Gauge,
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type { Truck } from '@/types/entities';
import type { TruckStatus, VerificationStatus } from '@/types/api';

interface TruckDetailCardProps {
  truck: Truck;
}

function getStatusBadge(status: TruckStatus, available: boolean) {
  if (!available) {
    return <Badge variant="secondary">غير متاح</Badge>;
  }

  const statusConfig: Record<TruckStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    AVAILABLE: { label: 'متاح', variant: 'default' },
    IN_SERVICE: { label: 'في الخدمة', variant: 'secondary' },
    IN_MAINTENANCE: { label: 'صيانة', variant: 'outline' },
    OUT_OF_SERVICE: { label: 'خارج الخدمة', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getVerificationBadge(status: VerificationStatus) {
  const statusConfig: Record<VerificationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
    VERIFIED: { label: 'موثق', variant: 'default', icon: CheckCircle2 },
    PENDING: { label: 'قيد المراجعة', variant: 'outline', icon: AlertTriangle },
    UNVERIFIED: { label: 'غير موثق', variant: 'destructive', icon: XCircle },
    REJECTED: { label: 'مرفوض', variant: 'destructive', icon: XCircle },
  };

  const config = statusConfig[status] || statusConfig.UNVERIFIED;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function TruckDetailCard({ truck }: TruckDetailCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <TruckIcon className="h-5 w-5" />
          تفاصيل الشاحنة
        </CardTitle>
        <div className="flex items-center gap-2">
          {getStatusBadge(truck.status, truck.available)}
          {getVerificationBadge(truck.verificationStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">رقم اللوحة</p>
            <p className="font-mono font-semibold text-lg">{truck.plateNumber}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">الموديل</p>
            <p className="font-semibold">{truck.model} ({truck.year})</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">السعة</p>
            <p className="font-semibold">{truck.capacity} طن</p>
          </div>
          {truck.dimensions && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الأبعاد</p>
              <p className="font-semibold">
                {truck.dimensions.length || '--'} × {truck.dimensions.width || '--'} × {truck.dimensions.height || '--'} م
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Driver Assignment */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            السائق المعين
          </h4>
          {truck.driver ? (
            <div className="rounded-lg border p-3">
              <p className="font-medium">{truck.driver.name}</p>
              <p className="text-sm text-muted-foreground">{truck.driver.phone}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">لم يتم تعيين سائق</p>
          )}
        </div>

        <Separator />

        {/* Vehicle Metrics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Fuel className="h-4 w-4" />
              مستوى الوقود
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    truck.currentFuelLevel > 50 ? 'bg-green-500' :
                    truck.currentFuelLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${truck.currentFuelLevel}%` }}
                />
              </div>
              <span className="text-sm font-medium">{truck.currentFuelLevel}%</span>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Gauge className="h-4 w-4" />
              عداد المسافة
            </div>
            <p className="font-semibold">{truck.odometer.toLocaleString('ar-SA')} كم</p>
          </div>
        </div>

        <Separator />

        {/* Maintenance Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            الصيانة
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">آخر صيانة</p>
              <p className="font-medium">{formatDate(truck.lastMaintenanceDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الصيانة القادمة</p>
              <p className="font-medium">{formatDate(truck.nextMaintenanceDate)}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Documentation Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            الوثائق
          </h4>
          <div className="space-y-2">
            {/* Insurance */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">التأمين</p>
                <p className="text-sm text-muted-foreground">
                  {truck.insuranceInfo.provider || 'غير محدد'}
                  {truck.insuranceInfo.expiryDate && ` • ينتهي ${formatDate(truck.insuranceInfo.expiryDate)}`}
                </p>
              </div>
              {truck.insuranceInfo.verified ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Registration */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">الترخيص</p>
                <p className="text-sm text-muted-foreground">
                  {truck.registrationInfo.registrationNumber || 'غير محدد'}
                  {truck.registrationInfo.expiryDate && ` • ينتهي ${formatDate(truck.registrationInfo.expiryDate)}`}
                </p>
              </div>
              {truck.registrationInfo.verified ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Technical Inspection */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">الفحص الفني</p>
                <p className="text-sm text-muted-foreground">
                  {truck.technicalInspection.status === 'PASSED' ? 'ناجح' :
                   truck.technicalInspection.status === 'PENDING' ? 'قيد الانتظار' :
                   truck.technicalInspection.status === 'FAILED' ? 'فشل' : 'منتهي'}
                  {truck.technicalInspection.nextInspectionDate && ` • القادم ${formatDate(truck.technicalInspection.nextInspectionDate)}`}
                </p>
              </div>
              {truck.technicalInspection.verified ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        {truck.features.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                المميزات
              </h4>
              <div className="flex flex-wrap gap-2">
                {truck.features.map((feature, index) => (
                  <Badge key={index} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default TruckDetailCard;
