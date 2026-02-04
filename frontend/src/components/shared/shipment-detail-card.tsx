'use client';

import {
  Package,
  Calendar,
  Truck,
  User,
  FileText,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ShipmentStatusBadge } from './status-badge';
import type { Shipment } from '@/types/entities';

interface ShipmentDetailCardProps {
  shipment: Shipment;
  className?: string;
  showAssignment?: boolean;
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatCurrency(amount?: number, currency = 'SAR') {
  if (!amount) return '--';
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
  }).format(amount);
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function InfoRow({ icon: Icon, label, value, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function ShipmentDetailCard({
  shipment,
  className,
  showAssignment = true,
}: ShipmentDetailCardProps) {
  const pricingLabel = shipment.pricingType === 'BIDDING' ? 'مزايدة' : 'سعر ثابت';
  const price = shipment.fixedPriceDetails?.amount;
  const currency = shipment.fixedPriceDetails?.currency || 'SAR';

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl">تفاصيل الشحنة</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">#{shipment._id.slice(-8)}</p>
        </div>
        <ShipmentStatusBadge status={shipment.status} size="lg" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Locations */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">المواقع</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-muted-foreground">نقطة الاستلام</span>
              </div>
              <p className="text-sm font-medium">{shipment.origin.address}</p>
              {shipment.origin.country && (
                <p className="text-xs text-muted-foreground mt-1">{shipment.origin.country}</p>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-muted-foreground">نقطة التسليم</span>
              </div>
              <p className="text-sm font-medium">{shipment.destination.address}</p>
              {shipment.destination.country && (
                <p className="text-xs text-muted-foreground mt-1">{shipment.destination.country}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Cargo Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">تفاصيل البضاعة</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              icon={Package}
              label="الوصف"
              value={shipment.cargoDetails.description}
            />
            <InfoRow
              icon={Package}
              label="الوزن"
              value={`${shipment.cargoDetails.weight} طن`}
            />
            {shipment.cargoDetails.volume && (
              <InfoRow
                icon={Package}
                label="الحجم"
                value={`${shipment.cargoDetails.volume} م³`}
              />
            )}
            {shipment.cargoDetails.category && (
              <InfoRow
                icon={FileText}
                label="الفئة"
                value={shipment.cargoDetails.category}
              />
            )}
          </div>
          {shipment.cargoDetails.hazardous && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">
                بضاعة خطرة - تتطلب تراخيص خاصة
              </span>
            </div>
          )}
          {shipment.cargoDetails.specialInstructions && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">تعليمات خاصة</p>
              <p className="text-sm">{shipment.cargoDetails.specialInstructions}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Pricing & Dates */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">التسعير والمواعيد</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              icon={DollarSign}
              label="نوع التسعير"
              value={
                <div className="flex items-center gap-2">
                  <span>{pricingLabel}</span>
                  {shipment.pricingType === 'FIXED_PRICE' && price && (
                    <Badge variant="secondary">{formatCurrency(price, currency)}</Badge>
                  )}
                </div>
              }
            />
            {shipment.incoterm && (
              <InfoRow icon={FileText} label="شرط التسليم" value={shipment.incoterm} />
            )}
            <InfoRow
              icon={Calendar}
              label="تاريخ الاستلام المتوقع"
              value={formatDate(shipment.estimatedPickupDate)}
            />
            <InfoRow
              icon={Calendar}
              label="تاريخ التسليم المتوقع"
              value={formatDate(shipment.estimatedDeliveryDate)}
            />
          </div>
        </div>

        {/* Assignment (if showing and assigned) */}
        {showAssignment && (shipment.assignedTruck || shipment.assignedDriver) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">التعيين</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {shipment.assignedTruck && (
                  <InfoRow
                    icon={Truck}
                    label="الشاحنة"
                    value={`${shipment.assignedTruck.model} - ${shipment.assignedTruck.plateNumber}`}
                  />
                )}
                {shipment.assignedDriver && (
                  <InfoRow
                    icon={User}
                    label="السائق"
                    value={shipment.assignedDriver.name}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Merchant */}
        {shipment.merchant && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">التاجر</h4>
              <InfoRow icon={User} label="الاسم" value={shipment.merchant.name} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ShipmentDetailCard;
