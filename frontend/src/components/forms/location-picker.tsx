'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Location {
  address: string;
  coordinates?: { lat: number; lng: number };
  country?: string;
}

interface LocationPickerProps {
  label: string;
  value: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  variant?: 'origin' | 'destination';
}

// Common locations for quick selection (can be expanded with API)
const commonLocations = [
  { address: 'الرياض, المملكة العربية السعودية', country: 'السعودية', coordinates: { lat: 24.7136, lng: 46.6753 } },
  { address: 'جدة, المملكة العربية السعودية', country: 'السعودية', coordinates: { lat: 21.4858, lng: 39.1925 } },
  { address: 'الدمام, المملكة العربية السعودية', country: 'السعودية', coordinates: { lat: 26.3927, lng: 49.9777 } },
  { address: 'دبي, الإمارات العربية المتحدة', country: 'الإمارات', coordinates: { lat: 25.2048, lng: 55.2708 } },
  { address: 'القاهرة, مصر', country: 'مصر', coordinates: { lat: 30.0444, lng: 31.2357 } },
  { address: 'عمّان, الأردن', country: 'الأردن', coordinates: { lat: 31.9454, lng: 35.9284 } },
];

export function LocationPicker({
  label,
  value,
  onChange,
  placeholder = 'أدخل العنوان...',
  error,
  className,
  variant = 'origin',
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value.address || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState(commonLocations);

  useEffect(() => {
    if (searchQuery) {
      const filtered = commonLocations.filter(
        (loc) =>
          loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered.length > 0 ? filtered : commonLocations);
    } else {
      setFilteredLocations(commonLocations);
    }
  }, [searchQuery]);

  const handleSelect = (location: typeof commonLocations[0]) => {
    onChange({
      address: location.address,
      country: location.country,
      coordinates: location.coordinates,
    });
    setSearchQuery(location.address);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange({
      ...value,
      address: newValue,
    });
  };

  const markerColor = variant === 'origin' ? 'text-green-500' : 'text-red-500';

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2">
        <MapPin className={cn('h-4 w-4', markerColor)} />
        {label}
      </Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className={cn('pr-10', error && 'border-destructive')}
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                المواقع الشائعة
              </p>
              <div className="space-y-1">
                {filteredLocations.map((location, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-right hover:bg-muted"
                    onClick={() => handleSelect(location)}
                  >
                    <MapPin className={cn('h-4 w-4 shrink-0', markerColor)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{location.address}</p>
                      <p className="text-xs text-muted-foreground">{location.country}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setShowSuggestions(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Country input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">الدولة (اختياري)</Label>
          <Input
            value={value.country || ''}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
            placeholder="الدولة"
            className="mt-1"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Click outside handler */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}

export default LocationPicker;
