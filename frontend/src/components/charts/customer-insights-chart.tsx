'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface CustomerInsightsChartProps {
  data?: Array<{
    _id: string;
    merchantName: string;
    merchantEmail: string;
    totalShipments: number;
    totalRevenue: number;
    avgOrderValue: number;
    firstOrderDate: string;
    lastOrderDate: string;
    daysSinceFirstOrder: number;
    daysSinceLastOrder: number;
  }>;
  isLoading?: boolean;
}

type SortField = 'merchantName' | 'totalShipments' | 'totalRevenue' | 'avgOrderValue';
type SortOrder = 'asc' | 'desc';

export function CustomerInsightsChart({ data, isLoading }: CustomerInsightsChartProps) {
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>رؤى العملاء</CardTitle>
          <CardDescription>أفضل العملاء حسب الإيرادات والشحنات</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue, 'ar')
        : bValue.localeCompare(aValue, 'ar');
    }

    return sortOrder === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>رؤى العملاء</CardTitle>
        <CardDescription>أفضل العملاء حسب الإيرادات والشحنات</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('merchantName')}
                  className="flex items-center gap-2 hover:bg-transparent"
                >
                  اسم العميل
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('totalShipments')}
                  className="flex items-center gap-2 hover:bg-transparent"
                >
                  عدد الشحنات
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('totalRevenue')}
                  className="flex items-center gap-2 hover:bg-transparent"
                >
                  إجمالي الإيرادات
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('avgOrderValue')}
                  className="flex items-center gap-2 hover:bg-transparent"
                >
                  متوسط قيمة الطلب
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>أيام منذ آخر طلب</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  لا توجد بيانات
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{customer.merchantName}</div>
                      <div className="text-xs text-muted-foreground">{customer.merchantEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.totalShipments}</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(customer.totalRevenue)}
                  </TableCell>
                  <TableCell>{formatCurrency(customer.avgOrderValue)}</TableCell>
                  <TableCell>
                    <span className={customer.daysSinceLastOrder > 30 ? 'text-amber-600' : ''}>
                      {customer.daysSinceLastOrder} يوم
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default CustomerInsightsChart;
