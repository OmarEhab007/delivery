'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Zap } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { automationRuleFormSchema, type AutomationRuleFormData } from '@/lib/validations';
import type { AutomationRule } from '@/types/entities';

interface AutomationRuleFormProps {
  rule?: AutomationRule;
  onSubmit: (data: AutomationRuleFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const triggerTypeOptions = [
  { value: 'delay', label: 'تأخير في التسليم' },
  { value: 'missing-update', label: 'عدم تحديث الموقع' },
];

const actionOptions = [
  { value: 'notify', label: 'إرسال إشعار' },
  { value: 'escalate', label: 'تصعيد للإدارة' },
];

export function AutomationRuleForm({
  rule,
  onSubmit,
  onCancel,
  isLoading = false,
}: AutomationRuleFormProps) {
  const form = useForm<AutomationRuleFormData>({
    resolver: zodResolver(automationRuleFormSchema),
    defaultValues: {
      name: rule?.name || '',
      triggerType: rule?.triggerType || 'delay',
      threshold: rule?.threshold || 24,
      thresholdUnit: 'hours',
      action: rule?.action || 'notify',
    },
  });

  const handleSubmit = async (data: AutomationRuleFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              إعدادات القاعدة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم القاعدة *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: تنبيه التأخير 24 ساعة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="triggerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المحفز *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المحفز" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {triggerTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    متى يجب تفعيل هذه القاعدة
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عتبة الوقت *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        placeholder="24"
                        {...field}
                        onChange={(e) => { const v = parseInt(e.target.value, 10); field.onChange(isNaN(v) ? 1 : Math.max(v, 1)); }}
                        className="max-w-[120px]"
                      />
                      <span className="text-sm text-muted-foreground">ساعات</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    عدد الساعات قبل تفعيل القاعدة
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الإجراء *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الإجراء" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {actionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    ماذا يحدث عند تفعيل القاعدة
                  </FormDescription>
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
            {rule ? 'حفظ التعديلات' : 'إنشاء القاعدة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AutomationRuleForm;
