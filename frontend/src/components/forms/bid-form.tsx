'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Truck, User, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TruckSelector } from './truck-selector';
import { DriverSelector } from './driver-selector';
import { useCreateApplication } from '@/hooks/use-applications';
import type { Shipment, Truck as TruckType, User as UserType } from '@/types/entities';

const bidSchema = z.object({
  truckId: z.string().min(1, 'يرجى اختيار الشاحنة'),
  driverId: z.string().min(1, 'يرجى اختيار السائق'),
  price: z.number().min(1, 'يرجى إدخال السعر'),
  currency: z.string().default('SAR'),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});

type BidFormData = z.infer<typeof bidSchema>;

interface BidFormProps {
  shipment: Shipment;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BidForm({ shipment, onSuccess, onCancel }: BidFormProps) {
  const createApplication = useCreateApplication();

  const form = useForm<BidFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bidSchema) as any,
    defaultValues: {
      truckId: '',
      driverId: '',
      price: 0,
      currency: 'SAR',
      notes: '',
    },
  });

  const onSubmit = async (data: BidFormData) => {
    createApplication.mutate(
      {
        shipmentId: shipment._id,
        assignedTruckId: data.truckId,
        driverId: data.driverId,
        bidDetails: {
          price: data.price,
          currency: data.currency,
          notes: data.notes,
          validUntil: data.validUntil,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  // Calculate suggested price based on cargo weight and distance
  const suggestedPrice = shipment.cargoDetails.weight * 500; // Simple estimation

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          تقديم عرض سعر
        </CardTitle>
        <CardDescription>
          قدم عرضك على الشحنة #{shipment._id.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Shipment Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">من</span>
                <span className="font-medium">{shipment.origin.address.split(',')[0]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">إلى</span>
                <span className="font-medium">{shipment.destination.address.split(',')[0]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الوزن</span>
                <span className="font-medium">{shipment.cargoDetails.weight} طن</span>
              </div>
            </div>

            {/* Truck Selection */}
            <FormField
              control={form.control}
              name="truckId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    الشاحنة
                  </FormLabel>
                  <FormControl>
                    <TruckSelector
                      value={field.value}
                      onSelect={(truck: TruckType | null) => field.onChange(truck?._id || '')}
                      error={form.formState.errors.truckId?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Driver Selection */}
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    السائق
                  </FormLabel>
                  <FormControl>
                    <DriverSelector
                      value={field.value}
                      onSelect={(driver: UserType | null) => field.onChange(driver?._id || '')}
                      error={form.formState.errors.driverId?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر المقترح</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    {suggestedPrice > 0 && (
                      <FormDescription>
                        السعر المقترح: {suggestedPrice.toLocaleString('ar-SA')} ر.س
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                        <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valid Until */}
            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صالح حتى (اختياري)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    تاريخ انتهاء صلاحية العرض
                  </FormDescription>
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
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    ملاحظات (اختياري)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أضف أي ملاحظات أو شروط إضافية..."
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
            <div className="flex items-center justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  إلغاء
                </Button>
              )}
              <Button type="submit" disabled={createApplication.isPending}>
                {createApplication.isPending && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
                تقديم العرض
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default BidForm;
