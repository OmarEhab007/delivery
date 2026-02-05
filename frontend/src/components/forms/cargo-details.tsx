'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CargoDetailsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  className?: string;
}

const cargoCategories = [
  { value: 'general', label: 'بضائع عامة' },
  { value: 'food', label: 'مواد غذائية' },
  { value: 'electronics', label: 'إلكترونيات' },
  { value: 'machinery', label: 'معدات وآلات' },
  { value: 'chemicals', label: 'مواد كيميائية' },
  { value: 'textiles', label: 'منسوجات' },
  { value: 'construction', label: 'مواد بناء' },
  { value: 'automotive', label: 'قطع سيارات' },
  { value: 'pharmaceuticals', label: 'أدوية' },
  { value: 'other', label: 'أخرى' },
];

export function CargoDetails({ form, className }: CargoDetailsProps) {
  const isHazardous = form.watch('cargoDetails.hazardous');

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">تفاصيل البضاعة</h3>
      </div>

      <FormField
        control={form.control}
        name="cargoDetails.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>وصف البضاعة</FormLabel>
            <FormControl>
              <Textarea
                placeholder="أدخل وصفاً تفصيلياً للبضاعة..."
                className="resize-none"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormDescription>
              قدم وصفاً واضحاً يساعد الناقل على فهم طبيعة البضاعة
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="cargoDetails.weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوزن (طن)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cargoDetails.volume"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الحجم (م³) - اختياري</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="cargoDetails.category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>فئة البضاعة</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة البضاعة" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {cargoCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="cargoDetails.hazardous"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                بضاعة خطرة
              </FormLabel>
              <FormDescription>
                حدد إذا كانت البضاعة تتطلب تراخيص خاصة للنقل
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

      {isHazardous && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                تنبيه: البضائع الخطرة
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                نقل البضائع الخطرة يتطلب تراخيص خاصة وشاحنات مجهزة.
                سيتم عرض العروض من الناقلين المعتمدين فقط.
              </p>
            </div>
          </div>
        </div>
      )}

      <FormField
        control={form.control}
        name="cargoDetails.specialInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>تعليمات خاصة (اختياري)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="أي تعليمات خاصة للتعامل مع البضاعة..."
                className="resize-none"
                rows={2}
                {...field}
              />
            </FormControl>
            <FormDescription>
              مثال: يتطلب التبريد، لا تضع فوقه بضاعة أخرى، إلخ.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export default CargoDetails;
