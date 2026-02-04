'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShipmentForm } from '@/components/forms/shipment-form';

export default function NewShipmentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/merchant/shipments">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إنشاء شحنة جديدة</h1>
          <p className="text-muted-foreground">
            أدخل تفاصيل الشحنة لبدء استقبال العروض
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <ShipmentForm />
      </div>
    </div>
  );
}
