'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';

// Dynamic import for Marker and Popup
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export type MarkerType = 'origin' | 'destination' | 'vehicle' | 'checkpoint' | 'custom';

export interface MapMarkerProps {
  position: { lat: number; lng: number };
  type?: MarkerType;
  label?: string;
  description?: string;
  timestamp?: string;
  speed?: number;
  heading?: number;
  children?: React.ReactNode;
  onClick?: () => void;
}

const markerColors: Record<MarkerType, string> = {
  origin: '#22C55E',      // green
  destination: '#EF4444', // red
  vehicle: '#3B82F6',     // blue
  checkpoint: '#F59E0B',  // amber
  custom: '#6B7280',      // gray
};

function createCustomIcon(type: MarkerType): L.DivIcon {
  const color = markerColors[type];

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 14px;">
          ${type === 'vehicle' ? '🚚' : ''}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export function MapMarker({
  position,
  type = 'custom',
  label,
  description,
  timestamp,
  speed,
  heading,
  children,
  onClick,
}: MapMarkerProps) {
  const [isClient, setIsClient] = useState(false);
  const [icon, setIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    setIsClient(true);
    setIcon(createCustomIcon(type));
  }, [type]);

  if (!isClient || !icon) {
    return null;
  }

  const pos: LatLngExpression = [position.lat, position.lng];

  return (
    <Marker
      position={pos}
      icon={icon}
      eventHandlers={onClick ? { click: onClick } : undefined}
    >
      <Popup>
        <div className="min-w-[150px]">
          {label && (
            <h4 className="font-semibold text-sm mb-1">{label}</h4>
          )}
          {description && (
            <p className="text-xs text-gray-600 mb-2">{description}</p>
          )}

          <div className="space-y-1 text-xs">
            {speed !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">السرعة:</span>
                <span className="font-medium">{speed} كم/س</span>
              </div>
            )}
            {heading !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">الاتجاه:</span>
                <span className="font-medium">{heading}°</span>
              </div>
            )}
            {timestamp && (
              <div className="flex justify-between">
                <span className="text-gray-500">الوقت:</span>
                <span className="font-medium">
                  {new Date(timestamp).toLocaleTimeString('ar-SA')}
                </span>
              </div>
            )}
          </div>

          {children}
        </div>
      </Popup>
    </Marker>
  );
}

export default MapMarker;
