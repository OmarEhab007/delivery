'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PortalHero } from '@/components/shared/portal-hero';
import {
  Truck,
  Package,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useDriverDashboard } from '@/hooks/use-drivers';
import { useCurrentUser } from '@/hooks/use-user';
import { DriverQuickActions } from '@/components/shared/driver-quick-actions';
import { DriverStatusToggle } from '@/components/shared/driver-status-toggle';
import type { DriverStatus } from '@/types/api';

export default function DriverDashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: dashboard, isLoading } = useDriverDashboard();

  const handleStatusChange = async (status: DriverStatus) => {
    // This would call the API to update driver status
    console.log('Status changed to:', status);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = dashboard?.stats || {
    completedDeliveries: 0,
    activeDeliveries: 0,
    totalDistance: 0,
    rating: 0,
  };

  return (
    <div className="space-y-6">
      <PortalHero
        title="مرحباً بك في بوابة السائق"
        subtitle="سائق الشحن"
        description="تابع الشحنة الحالية، حدّث حالتك، وتعرّف على التسليمات القادمة بسرعة."
        imageSrc="/brand/driver-hero.png"
        actionLabel="عرض الشحنات"
        actionHref="/driver/shipments"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">مرحباً، {user?.name || 'سائق'}</h1>
          <p className="text-muted-foreground">لوحة تحكم السائق</p>
        </div>
        <DriverStatusToggle
          currentStatus={'OFF_DUTY'}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Quick Actions */}
      <DriverQuickActions />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التسليمات المكتملة</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedDeliveries}</div>
            <p className="text-xs text-muted-foreground">هذا الشهر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التسليمات النشطة</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeliveries}</div>
            <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المسافة الإجمالية</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDistance.toLocaleString('ar-SA')}</div>
            <p className="text-xs text-muted-foreground">كم هذا الشهر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التقييم</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">من 5 نجوم</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Shipment & Assigned Truck */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Shipment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              الشحنة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.currentShipment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">
                    #{dashboard.currentShipment._id.slice(-8)}
                  </span>
                  <Badge>{dashboard.currentShipment.status}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span>{dashboard.currentShipment.origin.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>{dashboard.currentShipment.destination.address}</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/driver/shipments/${dashboard.currentShipment._id}`}>
                    متابعة التسليم
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">لا توجد شحنة حالية</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/driver/shipments">عرض الشحنات المتاحة</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Truck */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              الشاحنة المخصصة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.assignedTruck ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dashboard.assignedTruck.model}</span>
                  <Badge variant="outline">{dashboard.assignedTruck.plateNumber}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">السعة</span>
                    <p className="font-medium">{dashboard.assignedTruck.capacity} طن</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">العداد</span>
                    <p className="font-medium">
                      {dashboard.assignedTruck.odometer?.toLocaleString('ar-SA')} كم
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/driver/checkin">تسجيل الدخول/الخروج</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">لم يتم تخصيص شاحنة</p>
                <p className="text-xs text-muted-foreground mt-1">
                  تواصل مع مالك الأسطول
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deliveries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            التسليمات القادمة
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/driver/shipments">
              عرض الكل
              <ArrowRight className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {dashboard?.upcomingDeliveries && dashboard.upcomingDeliveries.length > 0 ? (
            <div className="space-y-4">
              {dashboard.upcomingDeliveries.slice(0, 3).map((shipment) => (
                <div
                  key={shipment._id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">#{shipment._id.slice(-8)}</span>
                      <Badge variant="outline" className="text-xs">
                        {shipment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {shipment.estimatedPickupDate ? new Date(shipment.estimatedPickupDate).toLocaleDateString('ar-SA') : '--'}
                      </span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/driver/shipments/${shipment._id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">لا توجد تسليمات قادمة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {dashboard?.alerts && dashboard.alerts.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              تنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 text-sm"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
