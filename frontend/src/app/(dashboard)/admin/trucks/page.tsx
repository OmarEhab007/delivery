'use client';

import { useState } from 'react';
import { Truck as TruckIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminTrucks } from '@/hooks/use-admin';

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function AdminTrucksPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminTrucks({ page, limit: 10 });

  const trucks = data?.data.trucks ?? [];
  const pagination = data?.data.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة الشاحنات</h1>
        <p className="text-muted-foreground">مراجعة حالة الأسطول والمعلومات الأساسية</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الشاحنات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم اللوحة</TableHead>
                  <TableHead>المالك</TableHead>
                  <TableHead>السائق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>متاحة</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : trucks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا توجد شاحنات
                    </TableCell>
                  </TableRow>
                ) : (
                  trucks.map((truck) => (
                    <TableRow key={truck._id}>
                      <TableCell className="flex items-center gap-2">
                        <TruckIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{truck.plateNumber}</span>
                      </TableCell>
                      <TableCell>{truck.owner?.name || truck.ownerId}</TableCell>
                      <TableCell>{truck.driver?.name || 'غير معين'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{truck.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {truck.available ? (
                          <Badge className="bg-green-500/10 text-green-600">نعم</Badge>
                        ) : (
                          <Badge variant="destructive">لا</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(truck.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
