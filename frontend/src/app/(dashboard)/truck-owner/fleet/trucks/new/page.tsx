'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TruckForm } from '@/components/forms/truck-form';
import { useCreateTruck } from '@/hooks/use-trucks';

export default function AddTruckPage() {
  const router = useRouter();
  const createTruck = useCreateTruck();

  const handleSubmit = async (data: {
    plateNumber: string;
    model: string;
    year: number;
    capacity: number;
    length?: number;
    width?: number;
    height?: number;
    features: string[];
  }) => {
    await createTruck.mutateAsync({
      plateNumber: data.plateNumber,
      model: data.model,
      year: data.year,
      capacity: data.capacity,
      dimensions: data.length || data.width || data.height ? {
        length: data.length,
        width: data.width,
        height: data.height,
      } : undefined,
      features: data.features,
    });
    router.push('/truck-owner/fleet');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/truck-owner/fleet">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إضافة شاحنة جديدة</h1>
            <p className="text-sm text-muted-foreground">
              أضف شاحنة جديدة إلى أسطولك
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <TruckForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/truck-owner/fleet')}
          isLoading={createTruck.isPending}
        />
      </div>
    </div>
  );
}
