'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { webhookFormSchema, type WebhookFormData } from '@/lib/validations';

interface WebhookFormProps {
  onSubmit: (data: WebhookFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const availableEvents = [
  { id: 'SHIPMENT_CREATED', label: 'إنشاء شحنة' },
  { id: 'SHIPMENT_STATUS_UPDATED', label: 'تحديث حالة الشحنة' },
  { id: 'SHIPMENT_DELIVERED', label: 'تسليم الشحنة' },
  { id: 'APPLICATION_SUBMITTED', label: 'تقديم عرض' },
  { id: 'APPLICATION_APPROVED', label: 'قبول عرض' },
];

export function WebhookForm({ onSubmit, onCancel, isLoading = false }: WebhookFormProps) {
  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      endpointUrl: '',
      eventTypes: [],
    },
  });

  const handleSubmit = async (data: WebhookFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plug className="h-5 w-5" />
              إعدادات الـ Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="endpointUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رابط الـ Endpoint *</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://api.example.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    الرابط الذي سيتلقى الإشعارات
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventTypes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>أنواع الأحداث *</FormLabel>
                    <FormDescription>
                      اختر الأحداث التي تريد استقبال إشعارات عنها
                    </FormDescription>
                  </div>
                  <div className="space-y-3">
                    {availableEvents.map((event) => (
                      <FormField
                        key={event.id}
                        control={form.control}
                        name="eventTypes"
                        render={({ field }) => (
                          <FormItem
                            className="flex flex-row items-start space-x-3 space-x-reverse space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(event.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, event.id])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== event.id)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {event.label}
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

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إضافة Webhook
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default WebhookForm;
