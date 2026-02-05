'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, FileText, Phone, Mail, Globe, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import type { Broker } from '@/types/entities';
import { brokerFormSchema, type BrokerFormData } from '@/lib/validations';
import { useState } from 'react';

interface BrokerFormProps {
  broker?: Broker;
  onSubmit: (data: BrokerFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function BrokerForm({ broker, onSubmit, onCancel, isLoading = false }: BrokerFormProps) {
  const [countryInput, setCountryInput] = useState('');

  const form = useForm<BrokerFormData>({
    resolver: zodResolver(brokerFormSchema),
    defaultValues: {
      name: broker?.name || '',
      licenseNumber: broker?.licenseNumber || '',
      countriesServed: broker?.countriesServed || [],
      contacts: {
        email: broker?.contacts?.email || '',
        phone: broker?.contacts?.phone || '',
      },
      notes: broker?.notes || '',
    },
  });

  const handleSubmit = async (data: BrokerFormData) => {
    await onSubmit(data);
  };

  const addCountry = () => {
    if (countryInput.trim()) {
      const currentCountries = form.getValues('countriesServed');
      if (!currentCountries.includes(countryInput.trim())) {
        form.setValue('countriesServed', [...currentCountries, countryInput.trim()]);
      }
      setCountryInput('');
    }
  };

  const removeCountry = (country: string) => {
    const currentCountries = form.getValues('countriesServed');
    form.setValue(
      'countriesServed',
      currentCountries.filter((c) => c !== country)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCountry();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الوسيط *</FormLabel>
                    <FormControl>
                      <Input placeholder="اسم شركة الوساطة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الترخيص *</FormLabel>
                    <FormControl>
                      <Input placeholder="رقم ترخيص الوساطة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Countries Served */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              الدول المخدومة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="countriesServed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>أضف الدول</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="اكتب اسم الدولة واضغط Enter"
                      value={countryInput}
                      onChange={(e) => setCountryInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Button type="button" onClick={addCountry} variant="secondary">
                      إضافة
                    </Button>
                  </div>
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((country) => (
                        <Badge key={country} variant="secondary" className="gap-1">
                          {country}
                          <button
                            type="button"
                            onClick={() => removeCountry(country)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5" />
              معلومات الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contacts.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="email@example.com" className="pr-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contacts.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="+966 50 000 0000" className="pr-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              ملاحظات إضافية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أي معلومات إضافية عن الوسيط..."
                      className="min-h-[100px]"
                      {...field}
                    />
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
            {broker ? 'حفظ التعديلات' : 'إضافة الوسيط'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default BrokerForm;
