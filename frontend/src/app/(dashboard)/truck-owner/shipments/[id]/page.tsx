'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ShipmentDetailCard } from '@/components/shared/shipment-detail-card';
import { BidForm } from '@/components/forms/bid-form';
import { TrackingMap } from '@/components/maps/tracking-map';
import { TrackingHistory } from '@/components/shared/tracking-history';
import { ConnectionStatusIndicator } from '@/components/shared/connection-status';
import { useShipment, useShipmentTracking } from '@/hooks/use-shipments';
import { useTrackingSocket } from '@/hooks/use-tracking-socket';
import { useTruckOwnerAvailableShipments, useTruckOwnerShipments } from '@/hooks/use-truck-owner';

export default function TruckOwnerShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;

  const { data: shipmentData, isLoading: shipmentLoading } = useShipment(shipmentId);
  const { data: trackingData } = useShipmentTracking(shipmentId);
  const { data: availableData, isLoading: availableLoading } = useTruckOwnerAvailableShipments({
    page: 1,
    limit: 50,
  });
  const { data: assignedData, isLoading: assignedLoading } = useTruckOwnerShipments();

  const availableShipments = availableData?.data.shipments || [];
  const assignedShipments = assignedData?.data.shipments || [];

  const shipment =
    shipmentData?.data ||
    availableShipments.find((item) => item._id === shipmentId) ||
    assignedShipments.find((item) => item._id === shipmentId);

  // Real-time tracking for assigned shipments
  const isAssigned = !!(
    shipment?.assignedTruckId &&
    ['ASSIGNED', 'LOADING', 'IN_TRANSIT', 'AT_BORDER', 'UNLOADING'].includes(shipment?.status || '')
  );

  const {
    connectionStatus,
    currentLocation: liveLocation,
    locationHistory,
    lastUpdate,
  } = useTrackingSocket({
    shipmentId,
    autoConnect: isAssigned,
  });

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

  const handleBidSuccess = () => {
    router.push('/truck-owner/applications');
  };

  const isLoading = shipmentLoading || (!shipmentData?.data && (availableLoading || assignedLoading));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">الشحنة غير موجودة</p>
        <Button variant="link" asChild>
          <Link href="/truck-owner/shipments">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  const canBid = shipment.status === 'REQUESTED' && shipment.pricingType === 'BIDDING';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/truck-owner/shipments">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تفاصيل الشحنة</h1>
          <p className="text-muted-foreground font-mono">#{shipmentId.slice(-8)}</p>
        </div>
      </div>

      {/* Content */}
      {isAssigned ? (
        // Assigned shipment view with tracking
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">التفاصيل</TabsTrigger>
            <TabsTrigger value="tracking">التتبع المباشر</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <ShipmentDetailCard shipment={shipment} showAssignment={true} />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">تتبع الشحنة المباشر</h3>
              <ConnectionStatusIndicator
                status={connectionStatus}
                lastUpdate={lastUpdate}
              />
            </div>

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
              isLive={connectionStatus === 'connected'}
              height="400px"
            />

            {trackingHistory.length > 0 && (
              <TrackingHistory
                history={trackingHistory}
                maxHeight="250px"
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // Bidding view
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Shipment Details */}
          <ShipmentDetailCard shipment={shipment} showAssignment={false} />

          {/* Bid Form */}
          {canBid ? (
            <BidForm
              shipment={shipment}
              onSuccess={handleBidSuccess}
              onCancel={() => router.back()}
            />
          ) : (
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  {shipment.status !== 'REQUESTED'
                    ? 'هذه الشحنة لم تعد متاحة للمزايدة'
                    : 'هذه الشحنة بسعر ثابت ولا تقبل العروض'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
