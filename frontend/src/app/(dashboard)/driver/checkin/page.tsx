'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Truck,
  LogIn,
  LogOut,
  Clock,
  Gauge,
  Fuel,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useDriverDashboard } from '@/hooks/use-drivers';
import { CheckinForm } from '@/components/forms/checkin-form';
import { toast } from 'sonner';

interface CheckinRecord {
  type: 'checkin' | 'checkout';
  timestamp: Date;
  odometer: number;
  fuelLevel: number;
  notes?: string;
}

export default function DriverCheckinPage() {
  const { data: dashboard, isLoading } = useDriverDashboard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  // Mock checkin status - would come from API
  const isCheckedIn = false;
  // When API is integrated, lastCheckin will be populated
  // For now using useState to allow proper typing
  const [lastCheckin] = useState<CheckinRecord | null>(null);

  // Mock recent history - would come from API
  const recentHistory: CheckinRecord[] = [
    {
      type: 'checkout',
      timestamp: new Date('2024-01-14T18:30:00'),
      odometer: 125450,
      fuelLevel: 45,
      notes: 'تم الانتهاء من الشحنة',
    },
    {
      type: 'checkin',
      timestamp: new Date('2024-01-14T08:00:00'),
      odometer: 125200,
      fuelLevel: 80,
    },
    {
      type: 'checkout',
      timestamp: new Date('2024-01-13T17:45:00'),
      odometer: 125000,
      fuelLevel: 30,
    },
    {
      type: 'checkin',
      timestamp: new Date('2024-01-13T07:30:00'),
      odometer: 124800,
      fuelLevel: 90,
    },
  ];

  if (isLoading) {
    return <CheckinPageSkeleton />;
  }

  const truck = dashboard?.assignedTruck;

  const handleCheckin = async () => {
    setIsSubmitting(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('تم تسجيل الدخول بنجاح');
      setShowCheckinForm(false);
    } catch {
      toast.error('فشل تسجيل الدخول');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('تم تسجيل الخروج بنجاح');
      setShowCheckoutForm(false);
    } catch {
      toast.error('فشل تسجيل الخروج');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!truck) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">تسجيل الدخول/الخروج</h1>
          <p className="text-muted-foreground">سجل دخولك وخروجك من العمل</p>
        </div>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Truck className="h-16 w-16 mx-auto text-yellow-600 dark:text-yellow-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">لم يتم تخصيص شاحنة</h2>
              <p className="text-muted-foreground mb-4">
                يجب أن يتم تخصيص شاحنة لك قبل أن تتمكن من تسجيل الدخول
              </p>
              <p className="text-sm text-muted-foreground">
                تواصل مع مالك الأسطول لتخصيص شاحنة
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">تسجيل الدخول/الخروج</h1>
        <p className="text-muted-foreground">سجل دخولك وخروجك من العمل</p>
      </div>

      {/* Current Status */}
      <Card className={isCheckedIn ? 'border-green-200 dark:border-green-900' : 'border-gray-200'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              الحالة الحالية
            </CardTitle>
            <Badge
              variant={isCheckedIn ? 'default' : 'secondary'}
              className={isCheckedIn ? 'bg-green-600' : ''}
            >
              {isCheckedIn ? 'متصل' : 'غير متصل'}
            </Badge>
          </div>
          <CardDescription>
            {isCheckedIn && lastCheckin
              ? `متصل منذ ${lastCheckin.timestamp.toLocaleTimeString('ar-SA')}`
              : 'لم تقم بتسجيل الدخول اليوم'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {!isCheckedIn ? (
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setShowCheckinForm(true)}
              >
                <LogIn className="ml-2 h-5 w-5" />
                تسجيل الدخول
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                className="flex-1"
                onClick={() => setShowCheckoutForm(true)}
              >
                <LogOut className="ml-2 h-5 w-5" />
                تسجيل الخروج
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Truck Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            الشاحنة المخصصة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">الموديل</p>
              <p className="text-lg font-semibold">{truck.model}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">رقم اللوحة</p>
              <p className="text-lg font-semibold font-mono">{truck.plateNumber}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">العداد</p>
              </div>
              <p className="text-lg font-semibold">
                {truck.odometer?.toLocaleString('ar-SA')} كم
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">الوقود</p>
              </div>
              <p className="text-lg font-semibold">{truck.currentFuelLevel || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkin/Checkout Forms */}
      {showCheckinForm && (
        <CheckinForm
          truck={truck}
          type="checkin"
          onSubmit={handleCheckin}
          onCancel={() => setShowCheckinForm(false)}
          isLoading={isSubmitting}
        />
      )}

      {showCheckoutForm && (
        <CheckinForm
          truck={truck}
          type="checkout"
          onSubmit={handleCheckout}
          onCancel={() => setShowCheckoutForm(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            السجل الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentHistory.length > 0 ? (
            <div className="space-y-4">
              {recentHistory.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        record.type === 'checkin'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-200'
                      }`}
                    >
                      {record.type === 'checkin' ? (
                        <LogIn className="h-5 w-5" />
                      ) : (
                        <LogOut className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {record.type === 'checkin' ? 'تسجيل دخول' : 'تسجيل خروج'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.timestamp.toLocaleDateString('ar-SA')} -{' '}
                        {record.timestamp.toLocaleTimeString('ar-SA')}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{record.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span>{record.odometer.toLocaleString('ar-SA')} كم</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <span>{record.fuelLevel}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">لا يوجد سجل سابق</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {isCheckedIn && (
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium">تذكير</p>
                <p className="text-sm text-muted-foreground">
                  لا تنسَ تسجيل الخروج عند انتهاء وردية العمل
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CheckinPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
