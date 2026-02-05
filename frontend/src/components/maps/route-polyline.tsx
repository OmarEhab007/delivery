'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression, PathOptions } from 'leaflet';

// Dynamic import for Polyline
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

export type RouteType = 'planned' | 'actual' | 'remaining' | 'completed';

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp?: string;
}

export interface RoutePolylineProps {
  points: RoutePoint[];
  type?: RouteType;
  color?: string;
  weight?: number;
  opacity?: number;
  dashed?: boolean;
  animated?: boolean;
}

const routeStyles: Record<RouteType, PathOptions> = {
  planned: {
    color: '#3B82F6',
    weight: 4,
    opacity: 0.6,
    dashArray: '10, 10',
  },
  actual: {
    color: '#22C55E',
    weight: 4,
    opacity: 0.8,
  },
  remaining: {
    color: '#F59E0B',
    weight: 3,
    opacity: 0.7,
    dashArray: '5, 10',
  },
  completed: {
    color: '#6B7280',
    weight: 3,
    opacity: 0.5,
  },
};

export function RoutePolyline({
  points,
  type = 'planned',
  color,
  weight,
  opacity,
  dashed,
}: RoutePolylineProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || points.length < 2) {
    return null;
  }

  const positions: LatLngExpression[] = points.map((point) => [point.lat, point.lng]);

  const baseStyle = routeStyles[type];
  const pathOptions: PathOptions = {
    ...baseStyle,
    ...(color && { color }),
    ...(weight && { weight }),
    ...(opacity && { opacity }),
    ...(dashed !== undefined && { dashArray: dashed ? '10, 10' : undefined }),
  };

  return <Polyline positions={positions} pathOptions={pathOptions} />;
}

// Utility function to calculate route distance
export function calculateRouteDistance(points: RoutePoint[]): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += haversineDistance(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );
  }
  return totalDistance;
}

// Haversine formula to calculate distance between two coordinates
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Utility function to estimate arrival time
export function estimateArrivalTime(
  remainingDistance: number,
  averageSpeed: number = 60 // km/h
): Date {
  const hoursRemaining = remainingDistance / averageSpeed;
  const arrivalTime = new Date();
  arrivalTime.setHours(arrivalTime.getHours() + hoursRemaining);
  return arrivalTime;
}

export default RoutePolyline;
