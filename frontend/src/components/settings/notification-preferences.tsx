'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';

const defaultPreferences = {
  emailUpdates: true,
  smsUpdates: false,
  pushUpdates: true,
  shipmentUpdates: true,
  bidUpdates: true,
  paymentUpdates: true,
  marketing: false,
};

type NotificationPreferencesState = typeof defaultPreferences;

interface PreferenceItem {
  key: keyof NotificationPreferencesState;
  title: string;
  description: string;
}

const preferenceItems: PreferenceItem[] = [
  {
    key: 'shipmentUpdates',
    title: 'تحديثات الشحنات',
    description: 'إشعارات فورية عند تغير حالة الشحنة أو وصولها.',
  },
  {
    key: 'bidUpdates',
    title: 'حالة العروض',
    description: 'تنبيه عند قبول أو رفض العروض المقدمة.',
  },
  {
    key: 'paymentUpdates',
    title: 'التحديثات المالية',
    description: 'إشعارات تأكيد الدفع والفواتير الجديدة.',
  },
  {
    key: 'emailUpdates',
    title: 'إشعارات البريد الإلكتروني',
    description: 'استقبال الرسائل المهمة عبر البريد الإلكتروني.',
  },
  {
    key: 'smsUpdates',
    title: 'رسائل SMS',
    description: 'تنبيهات عاجلة عبر رسائل الجوال.',
  },
  {
    key: 'pushUpdates',
    title: 'إشعارات التطبيق',
    description: 'إشعارات مباشرة داخل المنصة.',
  },
  {
    key: 'marketing',
    title: 'تحديثات تسويقية',
    description: 'أخبار الميزات الجديدة والعروض الخاصة.',
  },
];

export function NotificationPreferences() {
  const { data } = useSettings();
  const updateSettings = useUpdateSettings();
  const [preferences, setPreferences] = useState<NotificationPreferencesState>(defaultPreferences);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.notificationPreferences) {
      setPreferences({ ...defaultPreferences, ...data.notificationPreferences });
      setDirty(false);
    }
  }, [data]);

  const togglePreference = (key: keyof NotificationPreferencesState) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setDirty(true);
      return next;
    });
  };

  const onSave = async () => {
    await updateSettings.mutateAsync({ notificationPreferences: preferences });
    setDirty(false);
  };

  const summary = useMemo(() => {
    const enabledCount = Object.values(preferences).filter(Boolean).length;
    return `تم تفعيل ${enabledCount} من ${preferenceItems.length} إشعارات`;
  }, [preferences]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          تفضيلات الإشعارات
        </CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferenceItems.map((item, index) => (
          <div key={item.key} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={preferences[item.key]}
                onCheckedChange={() => togglePreference(item.key)}
              />
            </div>
            {index < preferenceItems.length - 1 && <Separator />}
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={!dirty || updateSettings.isPending}>
            {updateSettings.isPending ? 'جارٍ الحفظ...' : 'حفظ التفضيلات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationPreferences;
