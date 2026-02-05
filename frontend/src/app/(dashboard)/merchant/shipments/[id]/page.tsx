'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ShipmentDetailCard } from '@/components/shared/shipment-detail-card';
import { ShipmentTimeline } from '@/components/shared/shipment-timeline';
import { BidsTable } from '@/components/tables/bids-table';
import { BidActionDialog } from '@/components/shared/bid-action-dialog';
import { TrackingMap } from '@/components/maps/tracking-map';
import { TrackingHistory } from '@/components/shared/tracking-history';
import { ConnectionStatusIndicator } from '@/components/shared/connection-status';
import { ShipmentDocumentsSection } from '@/components/shared/shipment-documents-section';
import { useTrackingSocket } from '@/hooks/use-tracking-socket';
import {
  useShipment,
  useShipmentTimeline,
  useShipmentApplications,
  useShipmentTracking,
} from '@/hooks/use-shipments';
import { useAcceptApplication, useRejectApplication } from '@/hooks/use-applications';
import type { Application } from '@/types/entities';

export default function ShipmentDetailPage() {
  const params = useParams();
  const shipmentId = params.id as string;

  const { data: shipmentData, isLoading: shipmentLoading } = useShipment(shipmentId);
  const { data: timelineData } = useShipmentTimeline(shipmentId);
  const { data: applicationsData, isLoading: applicationsLoading } = useShipmentApplications(shipmentId);
  const { data: trackingData } = useShipmentTracking(shipmentId);

  const acceptApplication = useAcceptApplication();
  const rejectApplication = useRejectApplication();

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [bidAction, setBidAction] = useState<'accept' | 'reject' | null>(null);

  const shipment = shipmentData?.data;
  const timeline = timelineData?.data || [];
  const applications = applicationsData?.data || [];
  // Real-time tracking
  const {
    connectionStatus,
    currentLocation: liveLocation,
    locationHistory,
    lastUpdate,
  } = useTrackingSocket({
    shipmentId,
    autoConnect: shipment?.status === 'IN_TRANSIT' || shipment?.status === 'LOADING',
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

  const handleAcceptClick = (application: Application) => {
    setSelectedApplication(application);
    setBidAction('accept');
  };

  const handleRejectClick = (application: Application) => {
    setSelectedApplication(application);
    setBidAction('reject');
  };

  const handleAccept = async (id: string) => {
    await acceptApplication.mutateAsync(id);
    setBidAction(null);
    setSelectedApplication(null);
  };

  const handleReject = async (id: string, reason: string) => {
    await rejectApplication.mutateAsync({ id, data: { reason } });
    setBidAction(null);
    setSelectedApplication(null);
  };

  const canManageBids = shipment?.status === 'REQUESTED' && shipment.pricingType === 'BIDDING';

  if (shipmentLoading) {
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
          <Link href="/merchant/shipments">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/merchant/shipments">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تفاصيل الشحنة</h1>
          <p className="text-muted-foreground font-mono">#{shipmentId.slice(-8)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">التفاصيل</TabsTrigger>
              <TabsTrigger value="bids">
                العروض ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="documents">المستندات</TabsTrigger>
              <TabsTrigger value="tracking">التتبع</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <ShipmentDetailCard shipment={shipment} />
            </TabsContent>

            <TabsContent value="bids">
              <Card>
                <CardHeader>
                  <CardTitle>العروض المقدمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <BidsTable
                    applications={applications}
                    isLoading={applicationsLoading}
                    onAccept={handleAcceptClick}
                    onReject={handleRejectClick}
                    canManage={canManageBids}
                    emptyMessage="لم يتم تقديم عروض بعد"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <ShipmentDocumentsSection
                shipmentId={shipmentId}
                canUpload={shipment.status === 'REQUESTED' || shipment.status === 'PENDING_APPROVAL'}
                canDelete={shipment.status === 'REQUESTED' || shipment.status === 'PENDING_APPROVAL'}
              />
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
                height="350px"
              />

              {trackingHistory.length > 0 && (
                <TrackingHistory
                  history={trackingHistory}
                  maxHeight="250px"
                />
              )}

              {!liveLocation && !shipment.currentLocation && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      سيتم عرض موقع الشحنة عند بدء التوصيل
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Timeline */}
        <div>
          <ShipmentTimeline entries={timeline} />
        </div>
      </div>

      {/* Bid Action Dialog */}
      <BidActionDialog
        application={selectedApplication}
        action={bidAction}
        open={!!bidAction}
        onOpenChange={(open) => {
          if (!open) {
            setBidAction(null);
            setSelectedApplication(null);
          }
        }}
        onAccept={handleAccept}
        onReject={handleReject}
        isLoading={acceptApplication.isPending || rejectApplication.isPending}
      />
    </div>
  );
}
