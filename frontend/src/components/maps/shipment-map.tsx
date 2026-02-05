'use client';

import { useState } from 'react';
import { TrackingMap, type TrackingPoint } from './tracking-map';
import { useTrackingSocket } from '@/hooks/use-tracking-socket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface ShipmentMapProps {
  shipmentId: string;
  origin?: { address: string; coordinates?: { lat: number; lng: number } };
  destination?: { address: string; coordinates?: { lat: number; lng: number } };
  route?: TrackingPoint[];
  isLive?: boolean;
  className?: string;
  height?: string;
  title?: string;
}

export function ShipmentMap({
  shipmentId,
  origin,
  destination,
  route = [],
  isLive = false,
  className = '',
  height = '400px',
  title = 'تتبع الشحنة',
}: ShipmentMapProps) {
  const [showHistory, setShowHistory] = useState(false);

  // Use tracking socket to get live location updates
  const { currentLocation, locationHistory, isConnected } = useTrackingSocket({
    shipmentId,
    autoConnect: true,
  });

  // Convert origin to TrackingPoint if available
  const originPoint: TrackingPoint | undefined = origin?.coordinates
    ? {
        lat: origin.coordinates.lat,
        lng: origin.coordinates.lng,
      }
    : undefined;

  // Convert destination to TrackingPoint if available
  const destinationPoint: TrackingPoint | undefined = destination?.coordinates
    ? {
        lat: destination.coordinates.lat,
        lng: destination.coordinates.lng,
      }
    : undefined;

  // Convert socket location to TrackingPoint
  const currentLocationPoint: TrackingPoint | undefined = currentLocation
    ? {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        timestamp: currentLocation.timestamp,
        speed: currentLocation.speed,
        heading: currentLocation.heading,
      }
    : undefined;

  // Convert location history to TrackingPoint array
  const trackingHistory: TrackingPoint[] = locationHistory.map((loc) => ({
    lat: loc.lat,
    lng: loc.lng,
    timestamp: loc.timestamp,
    speed: loc.speed,
    heading: loc.heading,
  }));

  // Show placeholder if no coordinates available
  const hasCoordinates = originPoint || destinationPoint || currentLocationPoint;

  if (!hasCoordinates) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8" style={{ height }}>
          <div className="text-center text-muted-foreground">
            <MapPin className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">لا توجد إحداثيات متاحة للعرض</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <TrackingMap
        origin={originPoint}
        destination={destinationPoint}
        currentLocation={currentLocationPoint}
        route={route}
        trackingHistory={trackingHistory}
        showRoute={!showHistory}
        showHistory={showHistory && trackingHistory.length > 0}
        isLive={isLive && isConnected}
        height={height}
        title={title}
      />

      {/* Toggle button for tracking history */}
      {trackingHistory.length > 0 && (
        <div className="mt-2 flex justify-center">
          <Button
            variant={showHistory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'إخفاء المسار الفعلي' : 'عرض المسار الفعلي'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ShipmentMap;
