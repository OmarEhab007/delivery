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

interface GeoChartProps {
  data?: Array<{
    origin: string;
    destination: string;
    shipmentCount: number;
    totalRevenue: number;
    averageTravelTime: number;
  }>;
  isLoading?: boolean;
}

type SortField = 'origin' | 'destination' | 'shipmentCount' | 'totalRevenue' | 'averageTravelTime';
type SortOrder = 'asc' | 'desc';

export function GeoChart({ data, isLoading }: GeoChartProps) {
  const [sortField, setSortField] = useState<SortField>('shipmentCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التحليل الجغرافي</CardTitle>
          <CardDescription>أداء المسارات حسب الوجهة والأصل</CardDescription>
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

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)} ساعة`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days} يوم${remainingHours > 0 ? ` و ${remainingHours} ساعة` : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>التحليل الجغرافي</CardTitle>
        <CardDescription>أداء المسارات حسب الوجهة والأصل</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('origin')}
                  className="flex items-center gap-2 hover:bg-transparent"
                >
                  الأصل
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('destination')}
                  className="flex items-center gap-2 hover:bg-transparent"
                >
                  الوجهة
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('shipmentCount')}
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
                  onClick={() => handleSort('averageTravelTime')}
                  className="flex items-center gap-2 hover:bg-transparent"
                >
                  متوسط وقت السفر
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
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
              sortedData.map((lane, index) => (
                <TableRow key={`${lane.origin}-${lane.destination}-${index}`}>
                  <TableCell className="font-medium">{lane.origin}</TableCell>
                  <TableCell className="font-medium">{lane.destination}</TableCell>
                  <TableCell>{lane.shipmentCount}</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(lane.totalRevenue)}
                  </TableCell>
                  <TableCell>{formatTime(lane.averageTravelTime)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default GeoChart;
