'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Play, Gauge, MapPin, Package } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import type { Shipment } from '@/types/entities';

const startDeliverySchema = z.object({
  startOdometer: z.number().min(0, 'قراءة العداد مطلوبة'),
  cargoVerified: z.boolean().refine((val) => val === true, {
    message: 'يجب التأكد من استلام البضاعة',
  }),
  documentsVerified: z.boolean().refine((val) => val === true, {
    message: 'يجب التأكد من المستندات',
  }),
  notes: z.string().optional(),
});

type StartDeliveryFormData = z.infer<typeof startDeliverySchema>;

interface StartDeliveryFormProps {
  shipment: Shipment;
  onSubmit: (data: StartDeliveryFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function StartDeliveryForm({
  shipment,
  onSubmit,
  onCancel,
  isLoading = false,
}: StartDeliveryFormProps) {
  const form = useForm<StartDeliveryFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(startDeliverySchema) as any,
    defaultValues: {
      startOdometer: 0,
      cargoVerified: false,
      documentsVerified: false,
      notes: '',
    },
  });

  const handleSubmit = async (data: StartDeliveryFormData) => {
    await onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <Play className="h-5 w-5" />
          بدء التسليم
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Shipment Info */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">رقم الشحنة</span>
                <span className="font-mono">#{shipment._id.slice(-8)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">نقطة الاستلام</p>
                    <p className="text-xs text-muted-foreground">{shipment.origin.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">نقطة التسليم</p>
                    <p className="text-xs text-muted-foreground">{shipment.destination.address}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {shipment.cargoDetails.description} - {shipment.cargoDetails.weight} طن
                </span>
              </div>
            </div>

            {/* Start Odometer */}
            <FormField
              control={form.control}
              name="startOdometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    قراءة العداد الحالية (كم)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="أدخل قراءة العداد"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    سجل قراءة عداد المسافة قبل بدء الرحلة
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Verification Checklist */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">قائمة التحقق</h4>

              <FormField
                control={form.control}
                name="cargoVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>تأكيد استلام البضاعة</FormLabel>
                      <FormDescription>
                        تأكدت من استلام البضاعة كاملة ومطابقة للمواصفات
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentsVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>تأكيد المستندات</FormLabel>
                      <FormDescription>
                        تأكدت من وجود جميع المستندات المطلوبة للشحنة
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أي ملاحظات عن حالة البضاعة أو ظروف الاستلام..."
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
            <div className="flex items-center justify-end gap-4 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  إلغاء
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                بدء الرحلة
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default StartDeliveryForm;
