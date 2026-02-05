'use client';

import { useEffect, useMemo, useState } from 'react';
import { Truck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';

const defaultFleet = {
  maintenanceReminders: true,
  documentExpiry: true,
  driverStatusAlerts: true,
  newShipmentAlerts: true,
  idleTruckAlerts: false,
};

type FleetNotificationsState = typeof defaultFleet;

const fleetItems = [
  {
    key: 'maintenanceReminders',
    title: 'تذكيرات الصيانة',
    description: 'تنبيهات دورية عند اقتراب موعد صيانة الشاحنات.',
  },
  {
    key: 'documentExpiry',
    title: 'انتهاء المستندات',
    description: 'تنبيه عند اقتراب انتهاء صلاحية التأمين أو الرخص.',
  },
  {
    key: 'driverStatusAlerts',
    title: 'حالة السائقين',
    description: 'إشعار عند تغير حالة السائقين أو إيقافهم.',
  },
  {
    key: 'newShipmentAlerts',
    title: 'تنبيهات الشحنات الجديدة',
    description: 'تنبيه عند توفر شحنات جديدة تطابق أسطولك.',
  },
  {
    key: 'idleTruckAlerts',
    title: 'تنبيهات الخمول',
    description: 'إشعارات عند وجود شاحنات غير مستغلة لفترة طويلة.',
  },
] as const;

export function FleetNotifications() {
  const { data } = useSettings();
  const updateSettings = useUpdateSettings();
  const [fleet, setFleet] = useState<FleetNotificationsState>(defaultFleet);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.fleetNotifications) {
      setFleet({ ...defaultFleet, ...data.fleetNotifications });
      setDirty(false);
    }
  }, [data]);

  const toggle = (key: keyof FleetNotificationsState) => {
    setFleet((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setDirty(true);
      return next;
    });
  };

  const onSave = async () => {
    await updateSettings.mutateAsync({ fleetNotifications: fleet });
    setDirty(false);
  };

  const summary = useMemo(() => {
    const enabled = Object.values(fleet).filter(Boolean).length;
    return `مفعّل ${enabled} من ${fleetItems.length} تنبيهات تشغيلية`;
  }, [fleet]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          تنبيهات الأسطول
        </CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fleetItems.map((item, index) => (
          <div key={item.key} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch checked={fleet[item.key]} onCheckedChange={() => toggle(item.key)} />
            </div>
            {index < fleetItems.length - 1 && <Separator />}
          </div>
        ))}

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={!dirty || updateSettings.isPending}>
            {updateSettings.isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default FleetNotifications;
