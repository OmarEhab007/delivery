'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Package,
  MapPin,
  Truck,
  User,
  Phone,
  FileText,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useShipment, useShipmentTracking } from '@/hooks/use-shipments';
import {
  useDriverStartDelivery,
  useDriverCompleteDelivery,
  useDriverReportIssue,
  useDriverUpdateShipmentStatus,
} from '@/hooks/use-drivers';
import { useDriverLocationTracking } from '@/hooks/use-tracking-socket';
import { useCurrentUser } from '@/hooks/use-user';
import { StartDeliveryForm } from '@/components/forms/start-delivery-form';
import { CompleteDeliveryForm } from '@/components/forms/complete-delivery-form';
import { ReportIssueForm } from '@/components/forms/report-issue-form';
import { TrackingMap } from '@/components/maps/tracking-map';
import { TrackingHistory } from '@/components/shared/tracking-history';
import { ConnectionStatusIndicator, LiveIndicator } from '@/components/shared/connection-status';
import type { ShipmentStatus, IssueType } from '@/types/api';
import { driversApi } from '@/lib/api';
import { toast } from 'sonner';

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(',');
  const match = header?.match(/data:(.*);base64/);
  const mime = match?.[1] || 'image/png';
  const binary = atob(base64 || '');
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

const statusConfig: Record<ShipmentStatus, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: 'في انتظار الموافقة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/35 dark:text-yellow-200' },
  REQUESTED: { label: 'مطلوب', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-200' },
  CONFIRMED: { label: 'مؤكد', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/35 dark:text-indigo-200' },
  ASSIGNED: { label: 'تم التخصيص', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/35 dark:text-purple-200' },
  LOADING: { label: 'جاري التحميل', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/35 dark:text-cyan-200' },
  IN_TRANSIT: { label: 'في الطريق', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-200' },
  UNLOADING: { label: 'جاري التفريغ', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/35 dark:text-teal-200' },
  AT_BORDER: { label: 'عند الحدود', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/35 dark:text-orange-200' },
  DELIVERED: { label: 'تم التسليم', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' },
  COMPLETED: { label: 'مكتمل', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' },
  CANCELLED: { label: 'ملغي', color: 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-200' },
  DELAYED: { label: 'متأخر', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-200' },
  REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-200' },
};

const statusFlow: ShipmentStatus[] = [
  'ASSIGNED',
  'LOADING',
  'IN_TRANSIT',
  'AT_BORDER',
  'UNLOADING',
  'DELIVERED',
];

export default function ShipmentExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;

  const [showStartForm, setShowStartForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  const { data: response, isLoading, refetch } = useShipment(shipmentId);
  const updateStatus = useDriverUpdateShipmentStatus();
  const startDelivery = useDriverStartDelivery();
  const completeDelivery = useDriverCompleteDelivery();
  const reportIssue = useDriverReportIssue();
  const { data: trackingData } = useShipmentTracking(shipmentId);
  const shipment = response?.data;

  // Get current user for driver ID
  const { data: user } = useCurrentUser();

  // Real-time location tracking for driver
  const isActiveDelivery = ['LOADING', 'IN_TRANSIT', 'AT_BORDER', 'UNLOADING'].includes(shipment?.status || '');

  const {
    connectionStatus,
    currentLocation: liveLocation,
    locationHistory,
    lastUpdate,
    startTracking,
    stopTracking,
    isTracking,
  } = useDriverLocationTracking(user?._id || '', shipmentId);

  const persistedHistory = (trackingData?.data || [])
    .map((point) => ({
      lat: point.location?.coordinates?.[1],
      lng: point.location?.coordinates?.[0],
      timestamp: point.timestamp,
    }))
    .filter(
      (point) =>
        typeof point.lat === 'number' && typeof point.lng === 'number' && !!point.timestamp
    ) as Array<{ lat: number; lng: number; timestamp: string }>;
  const trackingHistory = locationHistory.length > 0 ? locationHistory : persistedHistory;

  if (isLoading) {
    return <ShipmentDetailSkeleton />;
  }

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">الشحنة غير موجودة</h2>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/driver/shipments">العودة للشحنات</Link>
        </Button>
      </div>
    );
  }

  const currentStatusIndex = statusFlow.indexOf(shipment.status);
  const canStartDelivery = shipment.status === 'ASSIGNED';
  const canUpdateStatus = currentStatusIndex >= 0 && currentStatusIndex < statusFlow.length - 1;
  const canCompleteDelivery = shipment.status === 'UNLOADING';

  const getNextStatus = (): ShipmentStatus | null => {
    const currentIndex = statusFlow.indexOf(shipment.status);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const handleStatusUpdate = async (newStatus: ShipmentStatus) => {
    await updateStatus.mutateAsync({ shipmentId, status: newStatus });
    refetch();
  };

  const handleStartDelivery = async (data: { startOdometer: number; notes?: string }) => {
    await startDelivery.mutateAsync({
      shipmentId,
      data: {
        startOdometer: data.startOdometer,
        notes: data.notes,
      },
    });
    setShowStartForm(false);
    refetch();
  };

  const handleCompleteDelivery = async (data: {
    endOdometer: number;
    recipientName: string;
    recipientSignature?: string;
    notes?: string;
    photos?: string[];
  }) => {
    await completeDelivery.mutateAsync({
      shipmentId,
      data: {
        endOdometer: data.endOdometer,
        recipientName: data.recipientName,
        recipientSignature: data.recipientSignature,
        notes: data.notes,
      },
    });

    if (data.photos && data.photos.length > 0) {
      try {
        await Promise.all(
          data.photos.map((photo, index) => {
            const blob = dataUrlToBlob(photo);
            const file = new File([blob], `proof-${shipmentId}-${index + 1}.png`, {
              type: blob.type || 'image/png',
            });
            const formData = new FormData();
            formData.append('proof', file);
            return driversApi.uploadProof(shipmentId, formData);
          })
        );
      } catch {
        toast.error('تعذر رفع إثباتات التسليم، يرجى المحاولة لاحقاً');
      }
    }

    setShowCompleteForm(false);
    refetch();
  };

  const handleReportIssue = async (data: { type: string; description: string }) => {
    await reportIssue.mutateAsync({
      shipmentId,
      data: {
        issueType: data.type as IssueType,
        description: data.description,
      },
    });
    setShowIssueForm(false);
  };

  const nextStatus = getNextStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">شحنة #{shipmentId.slice(-8)}</h1>
              <Badge className={statusConfig[shipment.status]?.color || 'bg-gray-100'}>
                {statusConfig[shipment.status]?.label || shipment.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {new Date(shipment.createdAt).toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-500/60 dark:hover:bg-orange-900/30"
            onClick={() => setShowIssueForm(true)}
          >
            <AlertTriangle className="ml-2 h-4 w-4" />
            الإبلاغ عن مشكلة
          </Button>

          {canStartDelivery && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowStartForm(true)}
            >
              <Play className="ml-2 h-4 w-4" />
              بدء التسليم
            </Button>
          )}

          {canCompleteDelivery && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowCompleteForm(true)}
            >
              <CheckCircle2 className="ml-2 h-4 w-4" />
              إتمام التسليم
            </Button>
          )}

          {canUpdateStatus && !canStartDelivery && !canCompleteDelivery && nextStatus && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>
                  <ArrowRight className="ml-2 h-4 w-4" />
                  {statusConfig[nextStatus]?.label || nextStatus}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تحديث حالة الشحنة</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل تريد تحديث حالة الشحنة إلى &ldquo;{statusConfig[nextStatus]?.label || nextStatus}&rdquo;؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusUpdate(nextStatus)}>
                    تأكيد
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardHeader>
          <CardTitle>مسار الشحنة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {statusFlow.map((status, index) => {
              const isCompleted = currentStatusIndex > index;
              const isCurrent = currentStatusIndex === index;
              return (
                <div key={status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center whitespace-nowrap ${
                        isCurrent ? 'font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {statusConfig[status]?.label || status}
                    </span>
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">تفاصيل الشحنة</TabsTrigger>
          <TabsTrigger value="route">المسار</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Origin & Destination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  معلومات المسار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                  <div>
                    <p className="font-medium">نقطة الاستلام</p>
                    <p className="text-sm text-muted-foreground">{shipment.origin.address}</p>
                    {shipment.origin.country && (
                      <p className="text-xs text-muted-foreground">{shipment.origin.country}</p>
                    )}
                  </div>
                </div>
                <div className="border-r-2 border-dashed border-gray-200 h-8 mr-1.5" />
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
                  <div>
                    <p className="font-medium">نقطة التسليم</p>
                    <p className="text-sm text-muted-foreground">{shipment.destination.address}</p>
                    {shipment.destination.country && (
                      <p className="text-xs text-muted-foreground">{shipment.destination.country}</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Navigation className="ml-2 h-4 w-4" />
                  فتح في الخرائط
                </Button>
              </CardContent>
            </Card>

            {/* Cargo Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  تفاصيل البضاعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الوصف</span>
                  <span className="font-medium">{shipment.cargoDetails.description}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الوزن</span>
                  <span>{shipment.cargoDetails.weight} طن</span>
                </div>
                {shipment.cargoDetails.volume && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">الحجم</span>
                    <span>{shipment.cargoDetails.volume} م³</span>
                  </div>
                )}
                {shipment.cargoDetails.hazardous && (
                  <div className="pt-2">
                    <Badge variant="destructive">بضاعة خطرة</Badge>
                  </div>
                )}
                {shipment.cargoDetails.specialInstructions && (
                  <div className="pt-2">
                    <span className="text-muted-foreground text-sm">تعليمات خاصة:</span>
                    <p className="text-sm mt-1">{shipment.cargoDetails.specialInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  معلومات الاتصال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shipment.merchant && (
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm text-muted-foreground">التاجر</p>
                      <p className="font-medium">{shipment.merchant.name}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {shipment.recipient && (
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm text-muted-foreground">المستلم</p>
                      <p className="font-medium">{shipment.recipient.name || 'غير محدد'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Truck & Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  الشاحنة والجدول
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shipment.assignedTruck && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الشاحنة</span>
                      <span className="font-medium">{shipment.assignedTruck.model}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">رقم اللوحة</span>
                      <span className="font-mono">{shipment.assignedTruck.plateNumber}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاريخ الاستلام</span>
                  <span>{shipment.estimatedPickupDate ? new Date(shipment.estimatedPickupDate).toLocaleDateString('ar-SA') : '--'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاريخ التسليم المتوقع</span>
                  <span>{shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('ar-SA') : '--'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="route" className="space-y-4">
          {/* Tracking Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">تتبع الموقع المباشر</h3>
                  <ConnectionStatusIndicator
                    status={connectionStatus}
                    lastUpdate={lastUpdate}
                    size="sm"
                  />
                  {isTracking && <LiveIndicator />}
                </div>
                {isActiveDelivery && (
                  <Button
                    variant={isTracking ? 'destructive' : 'default'}
                    size="sm"
                    onClick={isTracking ? stopTracking : startTracking}
                  >
                    <Navigation className="ml-2 h-4 w-4" />
                    {isTracking ? 'إيقاف التتبع' : 'بدء التتبع'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <TrackingMap
            origin={
              shipment.origin?.coordinates
                ? { lat: shipment.origin.coordinates.lat, lng: shipment.origin.coordinates.lng }
                : undefined
            }
            destination={
              shipment.destination?.coordinates
                ? { lat: shipment.destination.coordinates.lat, lng: shipment.destination.coordinates.lng }
                : undefined
            }
            currentLocation={
              liveLocation || (shipment.currentLocation?.coordinates
                ? {
                    lat: shipment.currentLocation.coordinates[1],
                    lng: shipment.currentLocation.coordinates[0],
                    timestamp: new Date().toISOString(),
                  }
                : undefined)
            }
            trackingHistory={trackingHistory}
            showHistory={trackingHistory.length > 0}
            isLive={isTracking}
            height="400px"
            title="خريطة المسار"
          />

          {/* Tracking History */}
          {trackingHistory.length > 0 && (
            <TrackingHistory
              history={trackingHistory}
              maxHeight="300px"
            />
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المستندات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.documents && shipment.documents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shipment.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-medium text-sm">{doc.name || `مستند ${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">{doc.documentType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">لا توجد مستندات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Start Delivery Dialog */}
      <Dialog open={showStartForm} onOpenChange={setShowStartForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>بدء التسليم</DialogTitle>
            <DialogDescription>
              تأكد من استلام البضاعة وسجل قراءة العداد
            </DialogDescription>
          </DialogHeader>
          <StartDeliveryForm
            shipment={shipment}
            onSubmit={handleStartDelivery}
            onCancel={() => setShowStartForm(false)}
            isLoading={startDelivery.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Complete Delivery Dialog */}
      <Dialog open={showCompleteForm} onOpenChange={setShowCompleteForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إتمام التسليم</DialogTitle>
            <DialogDescription>
              سجل بيانات التسليم وتوقيع المستلم
            </DialogDescription>
          </DialogHeader>
          <CompleteDeliveryForm
            shipment={shipment}
            onSubmit={handleCompleteDelivery}
            onCancel={() => setShowCompleteForm(false)}
            isLoading={completeDelivery.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={showIssueForm} onOpenChange={setShowIssueForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>الإبلاغ عن مشكلة</DialogTitle>
            <DialogDescription>
              قدم تفاصيل المشكلة التي واجهتها
            </DialogDescription>
          </DialogHeader>
          <ReportIssueForm
            shipment={shipment}
            onSubmit={handleReportIssue}
            onCancel={() => setShowIssueForm(false)}
            isLoading={reportIssue.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShipmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
