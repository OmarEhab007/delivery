'use client';

import { Truck, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { TruckStatusBadge } from '@/components/shared/status-badge';
import { useMyTrucks } from '@/hooks/use-trucks';
import type { Truck as TruckType } from '@/types/entities';
import { useState } from 'react';

interface TruckSelectorProps {
  value?: string;
  onSelect?: (truck: TruckType | null) => void;
  onChange?: (truckId: string) => void;
  disabled?: boolean;
  error?: string;
  filterAvailable?: boolean;
  placeholder?: string;
  showAvailableOnly?: boolean;
}

export function TruckSelector({
  value,
  onSelect,
  onChange,
  disabled = false,
  error,
  filterAvailable = true,
  placeholder = 'اختر الشاحنة',
  showAvailableOnly = false,
}: TruckSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: trucksData, isLoading } = useMyTrucks();

  const trucks = trucksData?.data || [];
  const shouldFilterAvailable = filterAvailable || showAvailableOnly;
  const availableTrucks = shouldFilterAvailable
    ? trucks.filter((t) => t.available && t.status === 'AVAILABLE')
    : trucks;

  const selectedTruck = trucks.find((t) => t._id === value);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              !value && 'text-muted-foreground',
              error && 'border-destructive'
            )}
            disabled={disabled}
          >
            {selectedTruck ? (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span>{selectedTruck.model}</span>
                <span className="text-muted-foreground">-</span>
                <span className="font-mono text-xs">{selectedTruck.plateNumber}</span>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="ابحث عن شاحنة..." />
            <CommandList>
              <CommandEmpty>
                {trucks.length === 0
                  ? 'لا توجد شاحنات مسجلة'
                  : 'لا توجد شاحنات متاحة'}
              </CommandEmpty>
              <CommandGroup>
                {availableTrucks.map((truck) => (
                  <CommandItem
                    key={truck._id}
                    value={`${truck.model} ${truck.plateNumber}`}
                    onSelect={() => {
                      const isDeselect = truck._id === value;
                      if (onChange) {
                        onChange(isDeselect ? '' : truck._id);
                      }
                      if (onSelect) {
                        onSelect(isDeselect ? null : truck);
                      }
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        value === truck._id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{truck.model}</p>
                          <p className="text-xs text-muted-foreground">
                            {truck.plateNumber} • {truck.capacity} طن
                          </p>
                        </div>
                      </div>
                      <TruckStatusBadge status={truck.status} size="sm" />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {availableTrucks.length === 0 && trucks.length > 0 && (
        <p className="text-xs text-yellow-600">
          جميع الشاحنات مشغولة حالياً
        </p>
      )}
    </div>
  );
}

export default TruckSelector;
