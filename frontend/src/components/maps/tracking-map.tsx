'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, Truck, Route as RouteIcon } from 'lucide-react';
import type { LatLngExpression } from 'leaflet';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

export interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp?: string;
  speed?: number;
  heading?: number;
}

export interface TrackingMapProps {
  origin?: TrackingPoint;
  destination?: TrackingPoint;
  currentLocation?: TrackingPoint;
  route?: TrackingPoint[];
  trackingHistory?: TrackingPoint[];
  showRoute?: boolean;
  showHistory?: boolean;
  isLive?: boolean;
  className?: string;
  height?: string;
  title?: string;
}

const defaultCenter: LatLngExpression = [24.7136, 46.6753]; // Riyadh, Saudi Arabia

export function TrackingMap({
  origin,
  destination,
  currentLocation,
  route = [],
  trackingHistory = [],
  showRoute = true,
  showHistory = false,
  isLive = false,
  className = '',
  height = '400px',
  title,
}: TrackingMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(6);
  const [showActualRoute, setShowActualRoute] = useState(showHistory);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setShowActualRoute(showHistory);
  }, [showHistory]);

  useEffect(() => {
    // Calculate map center based on available points
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setMapZoom(12);
    } else if (origin && destination) {
      // Center between origin and destination
      const centerLat = (origin.lat + destination.lat) / 2;
      const centerLng = (origin.lng + destination.lng) / 2;
      setMapCenter([centerLat, centerLng]);
      setMapZoom(6);
    } else if (origin) {
      setMapCenter([origin.lat, origin.lng]);
      setMapZoom(10);
    } else if (destination) {
      setMapCenter([destination.lat, destination.lng]);
      setMapZoom(10);
    }
  }, [origin, destination, currentLocation]);

  if (!isClient) {
    return <TrackingMapSkeleton height={height} title={title} />;
  }

  const routePath: LatLngExpression[] = route.map((point) => [point.lat, point.lng]);
  const historyPath: LatLngExpression[] = trackingHistory.map((point) => [point.lat, point.lng]);

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-4 w-4" />
            {title}
            {isLive && (
              <span className="flex items-center gap-1 text-xs font-normal text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                مباشر
              </span>
            )}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'p-0'}>
        <div style={{ height }} className="rounded-lg overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Origin Marker */}
            {origin && (
              <Marker position={[origin.lat, origin.lng]}>
                <Popup>
                  <div className="text-center">
                    <MapPin className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <p className="font-medium">نقطة الانطلاق</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination Marker */}
            {destination && (
              <Marker position={[destination.lat, destination.lng]}>
                <Popup>
                  <div className="text-center">
                    <MapPin className="h-4 w-4 text-red-600 mx-auto mb-1" />
                    <p className="font-medium">الوجهة</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Current Location Marker */}
            {currentLocation && (
              <Marker position={[currentLocation.lat, currentLocation.lng]}>
                <Popup>
                  <div className="text-center">
                    <Truck className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <p className="font-medium">الموقع الحالي</p>
                    {currentLocation.speed !== undefined && (
                      <p className="text-sm text-gray-600">
                        السرعة: {currentLocation.speed} كم/س
                      </p>
                    )}
                    {currentLocation.timestamp && (
                      <p className="text-xs text-gray-500">
                        {new Date(currentLocation.timestamp).toLocaleTimeString('ar-SA')}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Planned Route - shown when not displaying actual route */}
            {showRoute && !showActualRoute && routePath.length > 1 && (
              <Polyline
                positions={routePath}
                pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.7, dashArray: '10, 10' }}
              />
            )}

            {/* Tracking History - shown when toggle is enabled */}
            {showActualRoute && historyPath.length > 1 && (
              <Polyline
                positions={historyPath}
                pathOptions={{ color: '#10B981', weight: 3, opacity: 0.8 }}
              />
            )}
          </MapContainer>
        </div>

        {/* Toggle and Legend */}
        <div className="mt-3 space-y-2">
          {/* Toggle button for route history */}
          {trackingHistory.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant={showActualRoute ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowActualRoute(!showActualRoute)}
                className="gap-2"
              >
                <RouteIcon className="h-4 w-4" />
                {showActualRoute ? 'عرض المسار المخطط' : 'عرض المسار الفعلي'}
              </Button>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            {origin && (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>الانطلاق</span>
              </div>
            )}
            {destination && (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>الوجهة</span>
              </div>
            )}
            {currentLocation && (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>الموقع الحالي</span>
              </div>
            )}
            {showRoute && route.length > 0 && !showActualRoute && (
              <div className="flex items-center gap-1">
                <div className="h-1 w-4 bg-blue-500 opacity-70" style={{ borderStyle: 'dashed' }} />
                <span>المسار المخطط</span>
              </div>
            )}
            {showActualRoute && trackingHistory.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-1 w-4 bg-green-500" />
                <span>المسار الفعلي</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrackingMapSkeleton({ height, title }: { height: string; title?: string }) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'p-0'}>
        <Skeleton style={{ height }} className="rounded-lg" />
        <div className="flex justify-center gap-4 mt-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default TrackingMap;
