'use client';

import { useState } from 'react';
import { Loader2, User, Truck as TruckIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DriverSelector } from '@/components/forms/driver-selector';
import { TruckSelector } from '@/components/forms/truck-selector';
import type { Truck, User as UserEntity } from '@/types/entities';

interface AssignDriverDialogProps {
  truck: Truck | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (truckId: string, driverId: string) => Promise<void>;
  isLoading?: boolean;
}

interface AssignTruckDialogProps {
  driver: UserEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (driverId: string, truckId: string) => Promise<void>;
  isLoading?: boolean;
}

export function AssignDriverDialog({
  truck,
  open,
  onOpenChange,
  onAssign,
  isLoading = false,
}: AssignDriverDialogProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const handleAssign = async () => {
    if (!truck || !selectedDriverId) return;
    await onAssign(truck._id, selectedDriverId);
    setSelectedDriverId('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedDriverId('');
    }
    onOpenChange(newOpen);
  };

  if (!truck) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>تعيين سائق</DialogTitle>
              <DialogDescription>
                اختر سائقاً لتعيينه على الشاحنة {truck.plateNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Truck Info */}
        <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{truck.model}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">رقم اللوحة</span>
            <span className="font-mono">{truck.plateNumber}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">السعة</span>
            <span>{truck.capacity} طن</span>
          </div>
        </div>

        {/* Driver Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">اختر السائق</label>
          <DriverSelector
            value={selectedDriverId}
            onChange={setSelectedDriverId}
            placeholder="ابحث عن سائق..."
            showAvailableOnly
          />
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || !selectedDriverId}
          >
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تعيين السائق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssignTruckDialog({
  driver,
  open,
  onOpenChange,
  onAssign,
  isLoading = false,
}: AssignTruckDialogProps) {
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');

  const handleAssign = async () => {
    if (!driver || !selectedTruckId) return;
    await onAssign(driver._id, selectedTruckId);
    setSelectedTruckId('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTruckId('');
    }
    onOpenChange(newOpen);
  };

  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TruckIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>تعيين شاحنة</DialogTitle>
              <DialogDescription>
                اختر شاحنة لتعيينها للسائق {driver.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Driver Info */}
        <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{driver.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">الهاتف</span>
            <span className="font-mono" dir="ltr">{driver.phone}</span>
          </div>
          {driver.licenseNumber && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">رقم الرخصة</span>
              <span className="font-mono">{driver.licenseNumber}</span>
            </div>
          )}
        </div>

        {/* Truck Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">اختر الشاحنة</label>
          <TruckSelector
            value={selectedTruckId}
            onChange={setSelectedTruckId}
            placeholder="ابحث عن شاحنة..."
            showAvailableOnly
          />
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || !selectedTruckId}
          >
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تعيين الشاحنة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignDriverDialog;
