'use client';

import { SettingsLayout } from '@/components/settings/settings-layout';
import { ProfileForm } from '@/components/settings/profile-form';
import { NotificationPreferences } from '@/components/settings/notification-preferences';
import { FleetNotifications } from '@/components/settings/fleet-notifications';
import { PasswordForm } from '@/components/settings/password-form';

export default function TruckOwnerSettingsPage() {
  return (
    <SettingsLayout
      title="إعدادات مالك الشاحنة"
      description="إدارة بيانات الحساب وتنبيهات الأسطول وإعدادات الأمان."
      tabs={[
        {
          value: 'profile',
          label: 'الملف الشخصي',
          description: 'قم بتحديث بيانات الشركة وتفاصيل التواصل.',
          content: <ProfileForm />,
        },
        {
          value: 'notifications',
          label: 'الإشعارات العامة',
          description: 'تنظيم تحديثات المنصة ورسائل التنبيه.',
          content: <NotificationPreferences />,
        },
        {
          value: 'fleet',
          label: 'تنبيهات الأسطول',
          description: 'تحكم بالتنبيهات التشغيلية للشاحنات والسائقين.',
          content: <FleetNotifications />,
        },
        {
          value: 'security',
          label: 'الأمان',
          description: 'تعديل كلمة المرور وخيارات الأمان.',
          content: <PasswordForm />,
        },
      ]}
    />
  );
}
