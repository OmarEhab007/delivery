'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';

const defaultLocation = {
  shareLiveLocation: true,
  allowBackgroundUpdates: true,
  updateIntervalMinutes: 5,
};

type LocationSettingsState = typeof defaultLocation;

export function LocationSettings() {
  const { data } = useSettings();
  const updateSettings = useUpdateSettings();
  const [location, setLocation] = useState<LocationSettingsState>(defaultLocation);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.locationSettings) {
      setLocation({ ...defaultLocation, ...data.locationSettings });
      setDirty(false);
    }
  }, [data]);

  const updateField = <K extends keyof LocationSettingsState>(key: K, value: LocationSettingsState[K]) => {
    setLocation((prev) => {
      const next = { ...prev, [key]: value };
      setDirty(true);
      return next;
    });
  };

  const onSave = async () => {
    await updateSettings.mutateAsync({ locationSettings: location });
    setDirty(false);
  };

  const intervalLabel = useMemo(() => {
    const minutes = location.updateIntervalMinutes;
    return `تحديث كل ${minutes} دقيقة`;
  }, [location.updateIntervalMinutes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          مشاركة الموقع
        </CardTitle>
        <CardDescription>تحكم في مستوى مشاركة موقعك أثناء تنفيذ الشحنات.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">الموقع المباشر</p>
            <p className="text-xs text-muted-foreground">إرسال الموقع أثناء تنفيذ الشحنة فقط.</p>
          </div>
          <Switch
            checked={location.shareLiveLocation}
            onCheckedChange={(value) => updateField('shareLiveLocation', value)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">تحديث بالخلفية</p>
            <p className="text-xs text-muted-foreground">السماح بتحديث الموقع عند استخدام تطبيقات أخرى.</p>
          </div>
          <Switch
            checked={location.allowBackgroundUpdates}
            onCheckedChange={(value) => updateField('allowBackgroundUpdates', value)}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">وتيرة التحديث</p>
              <p className="text-xs text-muted-foreground">كلما كان التحديث أسرع زادت دقة التتبع.</p>
            </div>
            <span className="text-sm font-semibold text-primary">{intervalLabel}</span>
          </div>
          <Slider
            value={[location.updateIntervalMinutes]}
            min={2}
            max={15}
            step={1}
            onValueChange={(value) => updateField('updateIntervalMinutes', value[0])}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={!dirty || updateSettings.isPending}>
            {updateSettings.isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default LocationSettings;
