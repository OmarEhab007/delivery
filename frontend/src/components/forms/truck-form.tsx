'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Truck as TruckIcon, Calendar, Ruler, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { Truck } from '@/types/entities';

const truckSchema = z.object({
  plateNumber: z.string().min(1, 'رقم اللوحة مطلوب'),
  model: z.string().min(1, 'الموديل مطلوب'),
  year: z.number().min(1990, 'سنة الصنع غير صحيحة').max(new Date().getFullYear() + 1, 'سنة الصنع غير صحيحة'),
  capacity: z.number().min(1, 'السعة مطلوبة'),
  // Dimensions
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  // Features
  features: z.array(z.string()).default([]),
  // Insurance
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceExpiryDate: z.string().optional(),
  // Registration
  registrationNumber: z.string().optional(),
  registrationIssuedBy: z.string().optional(),
  registrationExpiryDate: z.string().optional(),
});

type TruckFormData = z.infer<typeof truckSchema>;

interface TruckFormProps {
  truck?: Truck;
  onSubmit: (data: TruckFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const availableFeatures = [
  { id: 'refrigerated', label: 'تبريد' },
  { id: 'gps_tracking', label: 'تتبع GPS' },
  { id: 'hazmat_certified', label: 'معتمد للمواد الخطرة' },
  { id: 'flatbed', label: 'سطحة' },
  { id: 'enclosed', label: 'صندوق مغلق' },
  { id: 'lift_gate', label: 'رافعة خلفية' },
  { id: 'air_ride', label: 'تعليق هوائي' },
  { id: 'tanker', label: 'صهريج' },
];

export function TruckForm({ truck, onSubmit, onCancel, isLoading = false }: TruckFormProps) {
  const form = useForm<TruckFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(truckSchema) as any,
    defaultValues: {
      plateNumber: truck?.plateNumber || '',
      model: truck?.model || '',
      year: truck?.year || new Date().getFullYear(),
      capacity: truck?.capacity || 0,
      length: truck?.dimensions?.length,
      width: truck?.dimensions?.width,
      height: truck?.dimensions?.height,
      features: truck?.features || [],
      insuranceProvider: truck?.insuranceInfo?.provider || '',
      insurancePolicyNumber: truck?.insuranceInfo?.policyNumber || '',
      insuranceExpiryDate: truck?.insuranceInfo?.expiryDate?.split('T')[0] || '',
      registrationNumber: truck?.registrationInfo?.registrationNumber || '',
      registrationIssuedBy: truck?.registrationInfo?.issuedBy || '',
      registrationExpiryDate: truck?.registrationInfo?.expiryDate?.split('T')[0] || '',
    },
  });

  const handleSubmit = async (data: TruckFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TruckIcon className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم اللوحة *</FormLabel>
                    <FormControl>
                      <Input placeholder="أ ب ج 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموديل *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: Mercedes Actros" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سنة الصنع *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1990}
                        max={new Date().getFullYear() + 1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعة (طن) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ruler className="h-5 w-5" />
              الأبعاد (اختياري)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطول (متر)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العرض (متر)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الارتفاع (متر)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              المميزات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="features"
              render={() => (
                <FormItem>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    {availableFeatures.map((feature) => (
                      <FormField
                        key={feature.id}
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                          <FormItem
                            key={feature.id}
                            className="flex flex-row items-start space-x-3 space-x-reverse space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(feature.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, feature.id])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== feature.id)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {feature.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              معلومات التأمين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شركة التأمين</FormLabel>
                    <FormControl>
                      <Input placeholder="اسم شركة التأمين" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurancePolicyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الوثيقة</FormLabel>
                    <FormControl>
                      <Input placeholder="رقم وثيقة التأمين" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="insuranceExpiryDate"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>تاريخ الانتهاء</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Registration Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              معلومات الترخيص
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الترخيص</FormLabel>
                    <FormControl>
                      <Input placeholder="رقم ترخيص المركبة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationIssuedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>جهة الإصدار</FormLabel>
                    <FormControl>
                      <Input placeholder="الجهة المصدرة للترخيص" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="registrationExpiryDate"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>تاريخ الانتهاء</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
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
            {truck ? 'حفظ التعديلات' : 'إضافة الشاحنة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default TruckForm;
