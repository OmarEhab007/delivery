'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCurrentUser, useUpdateProfile } from '@/hooks/use-user';
import type { UserRole } from '@/types/api';

const profileSchema = z.object({
  name: z.string().min(2, 'الاسم يجب ألا يقل عن حرفين'),
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  phone: z.string().min(8, 'يرجى إدخال رقم هاتف صحيح'),
  address: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const shouldShowCompany = (role?: UserRole) => role === 'Merchant' || role === 'TruckOwner';

export function ProfileForm() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      companyName: '',
      companyAddress: '',
      emergencyContact: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = form;

  useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        address: (user as { address?: string }).address ?? '',
        companyName: user.companyName ?? '',
        companyAddress: user.companyAddress ?? '',
        emergencyContact: (user as { emergencyContact?: string }).emergencyContact ?? '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfile.mutateAsync({
      ...values,
      address: values.address || undefined,
      companyName: values.companyName || undefined,
      companyAddress: values.companyAddress || undefined,
      emergencyContact: values.emergencyContact || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>معلومات الحساب</CardTitle>
        <CardDescription>تحديث البيانات الأساسية المرتبطة بحسابك.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" placeholder="الاسم" {...register('name')} disabled={isLoading} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@email.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" placeholder="05xxxxxxxx" {...register('phone')} disabled={isLoading} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input id="address" placeholder="المدينة، الشارع" {...register('address')} disabled={isLoading} />
            </div>
          </div>

          {shouldShowCompany(user?.role) && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">اسم الشركة</Label>
                <Input id="companyName" placeholder="اسم المنشأة" {...register('companyName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">عنوان الشركة</Label>
                <Input id="companyAddress" placeholder="عنوان الشركة" {...register('companyAddress')} />
              </div>
            </div>
          )}

          {user?.role === 'Driver' && (
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">جهة اتصال للطوارئ</Label>
              <Textarea
                id="emergencyContact"
                rows={2}
                placeholder="اسم جهة الاتصال ورقم الهاتف"
                {...register('emergencyContact')}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              آخر تحديث: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('ar-SA') : '—'}
            </p>
            <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
              <Save className="ml-2 h-4 w-4" />
              {updateProfile.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ProfileForm;
