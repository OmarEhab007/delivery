'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Package,
  Calendar,
  DollarSign,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LocationPicker } from './location-picker';
import { CargoDetails } from './cargo-details';
import { cn } from '@/lib/utils';
import { useCreateShipment } from '@/hooks/use-shipments';
import type { CreateShipmentRequest } from '@/types/api';

const shipmentSchema = z.object({
  pricingType: z.enum(['BIDDING', 'FIXED_PRICE'] as const),
  incoterm: z.string().optional(),
  fixedPriceDetails: z.object({
    amount: z.number().min(0).optional(),
    currency: z.string().optional(),
  }).optional(),
  origin: z.object({
    address: z.string().min(5, 'يرجى إدخال عنوان صحيح'),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  destination: z.object({
    address: z.string().min(5, 'يرجى إدخال عنوان صحيح'),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  cargoDetails: z.object({
    description: z.string().min(10, 'يرجى إدخال وصف تفصيلي للبضاعة'),
    weight: z.number().min(0.1, 'يرجى إدخال الوزن'),
    volume: z.number().optional(),
    category: z.string().optional(),
    hazardous: z.boolean().default(false),
    specialInstructions: z.string().optional(),
  }),
  estimatedPickupDate: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

const incoterms = [
  { value: 'EXW', label: 'EXW - تسليم في المصنع' },
  { value: 'FCA', label: 'FCA - التسليم للناقل' },
  { value: 'CPT', label: 'CPT - النقل مدفوع إلى' },
  { value: 'CIP', label: 'CIP - النقل والتأمين مدفوع إلى' },
  { value: 'DAP', label: 'DAP - التسليم في المكان' },
  { value: 'DPU', label: 'DPU - التسليم في مكان التفريغ' },
  { value: 'DDP', label: 'DDP - التسليم خالص الرسوم' },
  { value: 'FOB', label: 'FOB - التسليم على ظهر السفينة' },
  { value: 'CFR', label: 'CFR - التكلفة والشحن' },
  { value: 'CIF', label: 'CIF - التكلفة والتأمين والشحن' },
];

const steps = [
  { id: 1, title: 'المواقع', icon: MapPin },
  { id: 2, title: 'البضاعة', icon: Package },
  { id: 3, title: 'التسعير والمواعيد', icon: DollarSign },
];

interface ShipmentFormProps {
  onSuccess?: () => void;
}

export function ShipmentForm({ onSuccess }: ShipmentFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const createShipment = useCreateShipment();

  const form = useForm<ShipmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(shipmentSchema) as any,
    defaultValues: {
      pricingType: 'BIDDING',
      origin: { address: '' },
      destination: { address: '' },
      cargoDetails: {
        description: '',
        weight: 0,
        hazardous: false,
      },
    },
  });

  const pricingType = form.watch('pricingType');

  const onSubmit = async (data: ShipmentFormData) => {
    const payload: CreateShipmentRequest = {
      pricingType: data.pricingType,
      incoterm: data.incoterm,
      origin: data.origin,
      destination: data.destination,
      cargoDetails: data.cargoDetails,
      estimatedPickupDate: data.estimatedPickupDate,
      estimatedDeliveryDate: data.estimatedDeliveryDate,
    };

    if (data.pricingType === 'FIXED_PRICE' && data.fixedPriceDetails?.amount) {
      payload.fixedPriceDetails = {
        amount: data.fixedPriceDetails.amount,
        currency: data.fixedPriceDetails.currency || 'SAR',
      };
    }

    createShipment.mutate(payload, {
      onSuccess: () => {
        onSuccess?.();
        router.push('/merchant/shipments');
      },
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return form.watch('origin.address') && form.watch('destination.address');
      case 2:
        return form.watch('cargoDetails.description') && form.watch('cargoDetails.weight') > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-green-100 text-green-700',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                  )}
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  disabled={!isCompleted && !isActive}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'h-px w-8 mx-2',
                    isCompleted ? 'bg-green-500' : 'bg-border'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Locations */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                مواقع الاستلام والتسليم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <LocationPicker
                    label="نقطة الاستلام"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="أدخل عنوان الاستلام..."
                    variant="origin"
                    error={form.formState.errors.origin?.address?.message}
                  />
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <LocationPicker
                    label="نقطة التسليم"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="أدخل عنوان التسليم..."
                    variant="destination"
                    error={form.formState.errors.destination?.address?.message}
                  />
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Cargo Details */}
        {currentStep === 2 && (
          <Card>
            <CardContent className="pt-6">
              <CargoDetails form={form} />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Pricing and Dates */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  نوع التسعير
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="pricingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-4 sm:grid-cols-2"
                        >
                          <Label
                            htmlFor="bidding"
                            className={cn(
                              'flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-4 hover:bg-muted',
                              pricingType === 'BIDDING' && 'border-primary bg-primary/5'
                            )}
                          >
                            <RadioGroupItem value="BIDDING" id="bidding" className="sr-only" />
                            <span className="text-lg font-semibold">مزايدة</span>
                            <span className="text-sm text-muted-foreground text-center mt-2">
                              استقبل عروض أسعار من الناقلين واختر الأفضل
                            </span>
                          </Label>
                          <Label
                            htmlFor="fixed"
                            className={cn(
                              'flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-4 hover:bg-muted',
                              pricingType === 'FIXED_PRICE' && 'border-primary bg-primary/5'
                            )}
                          >
                            <RadioGroupItem value="FIXED_PRICE" id="fixed" className="sr-only" />
                            <span className="text-lg font-semibold">سعر ثابت</span>
                            <span className="text-sm text-muted-foreground text-center mt-2">
                              حدد السعر مسبقاً وتلقى طلبات القبول
                            </span>
                          </Label>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {pricingType === 'FIXED_PRICE' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="fixedPriceDetails.amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>السعر</FormLabel>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fixedPriceDetails.currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العملة</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || 'SAR'}>
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
                )}

                <FormField
                  control={form.control}
                  name="incoterm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شرط التسليم (Incoterm)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر شرط التسليم (اختياري)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {incoterms.map((term) => (
                            <SelectItem key={term.value} value={term.value}>
                              {term.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        يحدد مسؤوليات البائع والمشتري في عملية الشحن
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  المواعيد المتوقعة
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="estimatedPickupDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الاستلام المتوقع</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ التسليم المتوقع</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            السابق
          </Button>

          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              التالي
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={createShipment.isPending}
            >
              {createShipment.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              إنشاء الشحنة
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

export default ShipmentForm;
