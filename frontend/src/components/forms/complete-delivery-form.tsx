'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2, Gauge, User } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from './photo-upload';
import { SignatureCapture } from './signature-capture';
import type { Shipment } from '@/types/entities';

const completeDeliverySchema = z.object({
  endOdometer: z.number().min(0, 'قراءة العداد مطلوبة'),
  recipientName: z.string().min(1, 'اسم المستلم مطلوب'),
  recipientSignature: z.string().optional(),
  photos: z.array(z.string()).min(1, 'يجب إضافة صورة واحدة على الأقل'),
  notes: z.string().optional(),
});

type CompleteDeliveryFormData = z.infer<typeof completeDeliverySchema>;

interface CompleteDeliveryFormProps {
  shipment: Shipment;
  onSubmit: (data: CompleteDeliveryFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CompleteDeliveryForm({
  shipment,
  onSubmit,
  onCancel,
  isLoading = false,
}: CompleteDeliveryFormProps) {
  const form = useForm<CompleteDeliveryFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(completeDeliverySchema) as any,
    defaultValues: {
      endOdometer: shipment.endOdometer || shipment.startOdometer || 0,
      recipientName: shipment.recipient?.name || '',
      recipientSignature: shipment.recipient?.signature || '',
      photos: [],
      notes: '',
    },
  });

  const handleSubmit = async (data: CompleteDeliveryFormData) => {
    await onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          إتمام التسليم
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Shipment Info */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">رقم الشحنة</span>
                <span className="font-mono">#{shipment._id.slice(-8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الوجهة</span>
                <span className="text-sm">{shipment.destination.address.split(',')[0]}</span>
              </div>
              {shipment.startOdometer && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">عداد البداية</span>
                  <span>{shipment.startOdometer.toLocaleString('ar-SA')} كم</span>
                </div>
              )}
            </div>

            {/* End Odometer */}
            <FormField
              control={form.control}
              name="endOdometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    قراءة العداد عند الوصول (كم)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={shipment.startOdometer || 0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipient Name */}
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    اسم المستلم
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="الاسم الكامل للمستلم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Signature */}
            <FormField
              control={form.control}
              name="recipientSignature"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SignatureCapture
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload */}
            <FormField
              control={form.control}
              name="photos"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhotoUpload
                      value={field.value}
                      onChange={field.onChange}
                      maxPhotos={5}
                      label="صور إثبات التسليم"
                      description="أضف صور للشحنة والمستلم كدليل على التسليم"
                    />
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
                      placeholder="أي ملاحظات عن التسليم..."
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
                تأكيد التسليم
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default CompleteDeliveryForm;
