'use client';

import { SettingsLayout } from '@/components/settings/settings-layout';
import { ProfileForm } from '@/components/settings/profile-form';
import { NotificationPreferences } from '@/components/settings/notification-preferences';
import { LocationSettings } from '@/components/settings/location-settings';
import { PasswordForm } from '@/components/settings/password-form';

export default function DriverSettingsPage() {
  return (
    <SettingsLayout
      title="إعدادات السائق"
      description="اضبط مشاركة الموقع والإشعارات وتفاصيل الحساب."
      tabs={[
        {
          value: 'profile',
          label: 'الملف الشخصي',
          description: 'بيانات التواصل والمعلومات الأساسية للسائق.',
          content: <ProfileForm />,
        },
        {
          value: 'notifications',
          label: 'الإشعارات',
          description: 'إشعارات الحالة وتحديثات الشحنات.',
          content: <NotificationPreferences />,
        },
        {
          value: 'location',
          label: 'الموقع',
          description: 'خيارات مشاركة الموقع أثناء التوصيل.',
          content: <LocationSettings />,
        },
        {
          value: 'security',
          label: 'الأمان',
          description: 'تحديث كلمة المرور وإعدادات الأمان.',
          content: <PasswordForm />,
        },
      ]}
    />
  );
}
