'use client';

import { DollarSign, Calendar, CheckCircle, XCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { PaymentDetails } from '@/types/entities';

interface PaymentDetailsCardProps {
  payment: PaymentDetails;
}

export function PaymentDetailsCard({ payment }: PaymentDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          تفاصيل الدفع
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount */}
        {payment.amount != null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">المبلغ</span>
            <span className="text-lg font-bold">
              {payment.amount.toLocaleString()} {payment.currency || 'USD'}
            </span>
          </div>
        )}

        {/* Payment Date */}
        {payment.paymentDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              <Calendar className="mr-1 inline h-4 w-4" />
              تاريخ الدفع
            </span>
            <span className="text-sm">
              {format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: ar })}
            </span>
          </div>
        )}

        {/* Verification Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">حالة التحقق</span>
          {payment.paymentVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
              <CheckCircle className="h-3 w-3" />
              تم التحقق
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
              <XCircle className="h-3 w-3" />
              قيد التحقق
            </span>
          )}
        </div>

        {/* Receipt Download */}
        {payment.paymentReceiptUrl && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a
              href={payment.paymentReceiptUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              تحميل الإيصال
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
