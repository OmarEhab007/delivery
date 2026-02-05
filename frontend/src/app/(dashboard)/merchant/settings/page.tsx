'use client';

import { SettingsLayout } from '@/components/settings/settings-layout';
import { ProfileForm } from '@/components/settings/profile-form';
import { NotificationPreferences } from '@/components/settings/notification-preferences';
import { PasswordForm } from '@/components/settings/password-form';

export default function MerchantSettingsPage() {
  return (
    <SettingsLayout
      title="إعدادات التاجر"
      description="قم بتحديث بيانات الحساب وإدارة الإشعارات والأمان."
      tabs={[
        {
          value: 'profile',
          label: 'الملف الشخصي',
          description: 'بيانات التعريف الأساسية الخاصة بحسابك التجاري.',
          content: <ProfileForm />,
        },
        {
          value: 'notifications',
          label: 'الإشعارات',
          description: 'اختر الطريقة الأنسب لاستلام التحديثات.',
          content: <NotificationPreferences />,
        },
        {
          value: 'security',
          label: 'الأمان',
          description: 'غيّر كلمة المرور وتحقق من أمان الحساب.',
          content: <PasswordForm />,
        },
      ]}
    />
  );
}
