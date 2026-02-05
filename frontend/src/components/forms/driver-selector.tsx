'use client';

import { useState } from 'react';
import { User, Check, ChevronsUpDown } from 'lucide-react';
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
import { DriverStatusBadge } from '@/components/shared/status-badge';
import { useDrivers } from '@/hooks/use-drivers';
import type { User as UserType } from '@/types/entities';

interface DriverSelectorProps {
  value?: string;
  onSelect?: (driver: UserType | null) => void;
  onChange?: (driverId: string) => void;
  disabled?: boolean;
  error?: string;
  filterAvailable?: boolean;
  placeholder?: string;
  showAvailableOnly?: boolean;
}

export function DriverSelector({
  value,
  onSelect,
  onChange,
  disabled = false,
  error,
  filterAvailable = true,
  placeholder = 'اختر السائق',
  showAvailableOnly = false,
}: DriverSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: driversData, isLoading } = useDrivers({ role: 'Driver' });

  const drivers = driversData?.data || [];
  const shouldFilterAvailable = filterAvailable || showAvailableOnly;
  const availableDrivers = shouldFilterAvailable
    ? drivers.filter((d) => d.isAvailable && d.driverStatus === 'ACTIVE')
    : drivers;

  const selectedDriver = drivers.find((d) => d._id === value);

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
            {selectedDriver ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{selectedDriver.name}</span>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="ابحث عن سائق..." />
            <CommandList>
              <CommandEmpty>
                {drivers.length === 0
                  ? 'لا يوجد سائقين مسجلين'
                  : 'لا يوجد سائقين متاحين'}
              </CommandEmpty>
              <CommandGroup>
                {availableDrivers.map((driver) => (
                  <CommandItem
                    key={driver._id}
                    value={driver.name}
                    onSelect={() => {
                      const isDeselect = driver._id === value;
                      if (onChange) {
                        onChange(isDeselect ? '' : driver._id);
                      }
                      if (onSelect) {
                        onSelect(isDeselect ? null : driver);
                      }
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        value === driver._id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {driver.phone}
                          </p>
                        </div>
                      </div>
                      {driver.driverStatus && (
                        <DriverStatusBadge status={driver.driverStatus} size="sm" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {availableDrivers.length === 0 && drivers.length > 0 && (
        <p className="text-xs text-yellow-600">
          جميع السائقين مشغولون حالياً
        </p>
      )}
    </div>
  );
}

export default DriverSelector;
