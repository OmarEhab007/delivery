'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Truck, Fuel, Gauge } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import type { Truck as TruckType } from '@/types/entities';

const checkinSchema = z.object({
  odometer: z.number().min(0, 'قراءة العداد مطلوبة'),
  fuelLevel: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

interface CheckinFormProps {
  truck?: TruckType;
  type: 'checkin' | 'checkout';
  onSubmit: (data: CheckinFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CheckinForm({
  truck,
  type,
  onSubmit,
  onCancel,
  isLoading = false,
}: CheckinFormProps) {
  const form = useForm<CheckinFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(checkinSchema) as any,
    defaultValues: {
      odometer: truck?.odometer || 0,
      fuelLevel: truck?.currentFuelLevel || 50,
      notes: '',
    },
  });

  const handleSubmit = async (data: CheckinFormData) => {
    await onSubmit(data);
  };

  const fuelLevel = form.watch('fuelLevel');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          {type === 'checkin' ? 'تسجيل الدخول' : 'تسجيل الخروج'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Truck Info */}
            {truck && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الشاحنة</span>
                  <span className="font-medium">{truck.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">رقم اللوحة</span>
                  <span className="font-mono">{truck.plateNumber}</span>
                </div>
              </div>
            )}

            {/* Odometer */}
            <FormField
              control={form.control}
              name="odometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    قراءة العداد (كم)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    أدخل قراءة عداد المسافة الحالية
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fuel Level */}
            <FormField
              control={form.control}
              name="fuelLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    مستوى الوقود
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Slider
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">فارغ</span>
                        <span
                          className={
                            fuelLevel > 50
                              ? 'text-green-600 font-medium'
                              : fuelLevel > 20
                              ? 'text-yellow-600 font-medium'
                              : 'text-red-600 font-medium'
                          }
                        >
                          {fuelLevel}%
                        </span>
                        <span className="text-muted-foreground">ممتلئ</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أي ملاحظات عن حالة المركبة..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  إلغاء
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {type === 'checkin' ? 'تسجيل الدخول' : 'تسجيل الخروج'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default CheckinForm;
