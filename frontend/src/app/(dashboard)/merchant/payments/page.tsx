'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DollarSign, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorRetry } from '@/components/shared/error-retry';
import { useShipments } from '@/hooks/use-shipments';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Shipment } from '@/types/entities';

interface PaymentRow {
  shipmentId: string;
  amount: number | undefined;
  currency: string;
  paymentDate: string | undefined;
  paymentVerified: boolean;
  status: string;
}

export default function PaymentsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, isError, refetch } = useShipments({
    limit: 200,
  });

  const payments: PaymentRow[] = useMemo(() => {
    const shipmentsList: Shipment[] = data?.data || [];
    return shipmentsList
      .filter((s) => s.paymentDetails)
      .map((s) => ({
        shipmentId: s._id,
        amount: s.paymentDetails?.amount,
        currency: s.paymentDetails?.currency || 'USD',
        paymentDate: s.paymentDetails?.paymentDate,
        paymentVerified: s.paymentDetails?.paymentVerified || false,
        status: s.status,
      }))
      .filter((p) => {
        if (dateFrom && p.paymentDate && new Date(p.paymentDate) < new Date(dateFrom)) return false;
        if (dateTo && p.paymentDate && new Date(p.paymentDate) > new Date(dateTo)) return false;
        return true;
      })
      .sort((a, b) => {
        if (!a.paymentDate) return 1;
        if (!b.paymentDate) return -1;
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      });
  }, [data, dateFrom, dateTo]);

  const totalAmount = useMemo(
    () => payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  );

  const verifiedCount = useMemo(
    () => payments.filter((p) => p.paymentVerified).length,
    [payments]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return <ErrorRetry message="تعذر تحميل بيانات المدفوعات" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">المدفوعات</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
              <p className="text-2xl font-bold">{totalAmount.toLocaleString()} USD</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تم التحقق</p>
              <p className="text-2xl font-bold">{verifiedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/20">
              <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد التحقق</p>
              <p className="text-2xl font-bold">{payments.length - verifiedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm text-muted-foreground">من:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">إلى:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
          >
            مسح الفلتر
          </Button>
        )}
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="لا توجد مدفوعات"
          description="ستظهر المدفوعات هنا عند إتمام عمليات الدفع"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>سجل المدفوعات ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right">
                    <th className="px-4 py-3 font-medium text-muted-foreground">رقم الشحنة</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">المبلغ</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">التحقق</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.shipmentId} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/merchant/shipments/${payment.shipmentId}`}
                          className="font-mono text-primary hover:underline"
                        >
                          #{payment.shipmentId.slice(-8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {payment.amount != null ? payment.amount.toLocaleString() : '—'}{' '}
                        {payment.currency}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {payment.paymentDate
                          ? format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: ar })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {payment.paymentVerified ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            تم
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                            <XCircle className="h-4 w-4" />
                            قيد التحقق
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t bg-muted/30 font-medium">
                    <td className="px-4 py-3">الإجمالي</td>
                    <td className="px-4 py-3">{totalAmount.toLocaleString()} USD</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
