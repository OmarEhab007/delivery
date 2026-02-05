'use client';

import { SettingsLayout } from '@/components/settings/settings-layout';
import { ProfileForm } from '@/components/settings/profile-form';
import { NotificationPreferences } from '@/components/settings/notification-preferences';
import { PasswordForm } from '@/components/settings/password-form';

export default function AdminSettingsPage() {
  return (
    <SettingsLayout
      title="إعدادات المسؤول"
      description="إدارة بيانات المسؤول والإشعارات والأمان."
      tabs={[
        {
          value: 'profile',
          label: 'الملف الشخصي',
          description: 'تحديث بيانات الحساب الإداري.',
          content: <ProfileForm />,
        },
        {
          value: 'notifications',
          label: 'الإشعارات',
          description: 'تنظيم الإشعارات التشغيلية الحساسة.',
          content: <NotificationPreferences />,
        },
        {
          value: 'security',
          label: 'الأمان',
          description: 'تأمين الوصول إلى لوحة التحكم.',
          content: <PasswordForm />,
        },
      ]}
    />
  );
}
