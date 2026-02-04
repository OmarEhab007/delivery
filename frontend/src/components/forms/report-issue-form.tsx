'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertTriangle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhotoUpload } from './photo-upload';
import type { IssueType } from '@/types/api';
import type { Shipment } from '@/types/entities';

const reportIssueSchema = z.object({
  type: z.string().min(1, 'نوع المشكلة مطلوب'),
  description: z.string().min(10, 'وصف المشكلة يجب أن يكون 10 أحرف على الأقل'),
  photos: z.array(z.string()).optional(),
});

type ReportIssueFormData = z.infer<typeof reportIssueSchema>;

interface ReportIssueFormProps {
  shipment: Shipment;
  onSubmit: (data: ReportIssueFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const issueTypes: { value: IssueType; label: string }[] = [
  { value: 'DELIVERY_FAILED', label: 'فشل التسليم' },
  { value: 'ACCIDENT', label: 'حادث' },
  { value: 'CARGO_DAMAGED', label: 'تلف البضاعة' },
  { value: 'VEHICLE_BREAKDOWN', label: 'عطل المركبة' },
  { value: 'TRAFFIC', label: 'تأخير بسبب الازدحام' },
  { value: 'WEATHER', label: 'تأخير بسبب الطقس' },
  { value: 'OTHER', label: 'أخرى' },
];

export function ReportIssueForm({
  shipment,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReportIssueFormProps) {
  const form = useForm<ReportIssueFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(reportIssueSchema) as any,
    defaultValues: {
      type: '',
      description: '',
      photos: [],
    },
  });

  const handleSubmit = async (data: ReportIssueFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="border-orange-200 dark:border-orange-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-5 w-5" />
          الإبلاغ عن مشكلة
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
                <span className="text-sm text-muted-foreground">الحالة</span>
                <span className="text-sm">{shipment.status}</span>
              </div>
            </div>

            {/* Issue Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المشكلة *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المشكلة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف المشكلة *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="اشرح المشكلة بالتفصيل..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    قدم وصفاً مفصلاً للمشكلة لمساعدة فريق الدعم
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photos */}
            <FormField
              control={form.control}
              name="photos"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhotoUpload
                      value={field.value || []}
                      onChange={field.onChange}
                      maxPhotos={3}
                      label="صور توضيحية (اختياري)"
                      description="أضف صور توضح المشكلة إن أمكن"
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
                variant="destructive"
              >
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إرسال التقرير
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ReportIssueForm;
