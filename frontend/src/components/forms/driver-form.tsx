'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Phone, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { User as UserEntity } from '@/types/entities';

const driverSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
  licenseNumber: z.string().min(1, 'رقم الرخصة مطلوب'),
  licenseIssueDate: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  licenseIssuedBy: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

type DriverFormData = z.infer<typeof driverSchema>;

interface DriverFormProps {
  driver?: UserEntity;
  onSubmit: (data: DriverFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function DriverForm({ driver, onSubmit, onCancel, isLoading = false }: DriverFormProps) {
  const isEditing = !!driver;

  const form = useForm<DriverFormData>({
    /* eslint-disable @typescript-eslint/no-explicit-any */
    resolver: zodResolver(
      isEditing
        ? driverSchema.omit({ password: true })
        : driverSchema.extend({ password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل') })
    ) as any,
    /* eslint-enable @typescript-eslint/no-explicit-any */
    defaultValues: {
      name: driver?.name || '',
      email: driver?.email || '',
      phone: driver?.phone || '',
      password: '',
      licenseNumber: driver?.licenseNumber || '',
      licenseIssueDate: driver?.driverLicense?.issueDate?.split('T')[0] || '',
      licenseExpiryDate: driver?.driverLicense?.expiryDate?.split('T')[0] || '',
      licenseIssuedBy: driver?.driverLicense?.issuedBy || '',
      isAvailable: driver?.isAvailable ?? true,
    },
  });

  const handleSubmit = async (data: DriverFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل *</FormLabel>
                  <FormControl>
                    <Input placeholder="الاسم الكامل للسائق" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        dir="ltr"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الهاتف *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+966 5XX XXX XXXX"
                        dir="ltr"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="كلمة المرور" {...field} />
                    </FormControl>
                    <FormDescription>
                      يجب أن تكون 6 أحرف على الأقل
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* License Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              معلومات الرخصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الرخصة *</FormLabel>
                    <FormControl>
                      <Input placeholder="رقم رخصة القيادة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseIssuedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>جهة الإصدار</FormLabel>
                    <FormControl>
                      <Input placeholder="الجهة المصدرة للرخصة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="licenseIssueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الإصدار</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseExpiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الانتهاء</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">متاح للعمل</FormLabel>
                    <FormDescription>
                      تحديد ما إذا كان السائق متاحاً للتعيين على الشحنات
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'حفظ التعديلات' : 'تسجيل السائق'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default DriverForm;
