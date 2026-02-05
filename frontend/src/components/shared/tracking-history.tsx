'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  MapPin,
  Clock,
  Navigation,
  ChevronDown,
  ChevronUp,
  Gauge,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface TrackingHistoryPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  status?: string;
  note?: string;
}

interface TrackingHistoryProps {
  history: TrackingHistoryPoint[];
  isLoading?: boolean;
  maxHeight?: string;
  showMap?: boolean;
  onPointClick?: (point: TrackingHistoryPoint, index: number) => void;
  onClearHistory?: () => void;
  className?: string;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTimeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
  } catch {
    return '--';
  }
}

function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function getHeadingDirection(heading?: number): string {
  if (heading === undefined) return '--';

  const directions = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

export function TrackingHistory({
  history,
  isLoading = false,
  maxHeight = '400px',
  onPointClick,
  onClearHistory,
  className,
}: TrackingHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePointClick = (point: TrackingHistoryPoint, index: number) => {
    setSelectedIndex(index);
    onPointClick?.(point, index);
  };

  if (isLoading) {
    return <TrackingHistorySkeleton />;
  }

  const reversedHistory = [...history].reverse(); // Show newest first

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-4 w-4" />
            سجل التتبع
            <Badge variant="secondary" className="text-xs">
              {history.length} نقطة
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {onClearHistory && history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="h-8 px-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">لا يوجد سجل تتبع حتى الآن</p>
            </div>
          ) : (
            <ScrollArea style={{ maxHeight }} className="pr-4">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-4">
                  {reversedHistory.map((point, index) => (
                    <div
                      key={index}
                      className={cn(
                        'relative pr-8 cursor-pointer transition-colors',
                        selectedIndex === history.length - 1 - index && 'bg-muted/50 -mr-4 pr-12 pl-4 py-2 rounded-lg'
                      )}
                      onClick={() => handlePointClick(point, history.length - 1 - index)}
                    >
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'absolute right-0 top-1 h-4 w-4 rounded-full border-2 border-background',
                          index === 0 ? 'bg-green-500' : 'bg-muted-foreground'
                        )}
                      />

                      <div className="space-y-1">
                        {/* Time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{formatTime(point.timestamp)}</span>
                            {index === 0 && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                الآن
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(point.timestamp)}
                          </span>
                        </div>

                        {/* Coordinates */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="font-mono">{formatCoordinates(point.lat, point.lng)}</span>
                        </div>

                        {/* Speed and Heading */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {point.speed !== undefined && (
                            <div className="flex items-center gap-1">
                              <Gauge className="h-3 w-3" />
                              <span>{point.speed.toFixed(0)} كم/س</span>
                            </div>
                          )}
                          {point.heading !== undefined && (
                            <div className="flex items-center gap-1">
                              <Navigation className="h-3 w-3" style={{ transform: `rotate(${point.heading}deg)` }} />
                              <span>{getHeadingDirection(point.heading)}</span>
                            </div>
                          )}
                        </div>

                        {/* Status or Note */}
                        {(point.status || point.note) && (
                          <div className="text-xs">
                            {point.status && (
                              <Badge variant="outline" className="text-xs">
                                {point.status}
                              </Badge>
                            )}
                            {point.note && (
                              <p className="text-muted-foreground mt-1">{point.note}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Summary stats */}
          {history.length > 1 && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">عدد النقاط</p>
                  <p className="font-semibold">{history.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">مدة التتبع</p>
                  <p className="font-semibold">
                    {history.length > 1
                      ? formatDistanceToNow(new Date(history[0].timestamp), { locale: ar })
                      : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">متوسط السرعة</p>
                  <p className="font-semibold">
                    {history.some((p) => p.speed !== undefined)
                      ? `${(history.reduce((sum, p) => sum + (p.speed || 0), 0) / history.filter((p) => p.speed !== undefined).length).toFixed(0)} كم/س`
                      : '--'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function TrackingHistorySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default TrackingHistory;
