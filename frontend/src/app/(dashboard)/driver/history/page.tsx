'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  History,
  TrendingUp,
  Clock,
  MapPin,
  Search,
  Calendar,
  Download,
  CheckCircle2,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useDriverShipments } from '@/hooks/use-drivers';
import { PortalHero } from '@/components/shared/portal-hero';
import type { ShipmentStatus } from '@/types/api';

const statusConfig: Record<ShipmentStatus, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: 'في انتظار الموافقة', color: 'bg-yellow-100 text-yellow-800' },
  REQUESTED: { label: 'مطلوب', color: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { label: 'مؤكد', color: 'bg-indigo-100 text-indigo-800' },
  ASSIGNED: { label: 'تم التخصيص', color: 'bg-purple-100 text-purple-800' },
  LOADING: { label: 'جاري التحميل', color: 'bg-cyan-100 text-cyan-800' },
  IN_TRANSIT: { label: 'في الطريق', color: 'bg-blue-100 text-blue-800' },
  UNLOADING: { label: 'جاري التفريغ', color: 'bg-teal-100 text-teal-800' },
  AT_BORDER: { label: 'عند الحدود', color: 'bg-orange-100 text-orange-800' },
  DELIVERED: { label: 'تم التسليم', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'مكتمل', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'ملغي', color: 'bg-red-100 text-red-800' },
  DELAYED: { label: 'متأخر', color: 'bg-amber-100 text-amber-800' },
  REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-800' },
};

export default function DriverHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDriverShipments({
    page,
    limit: 10,
  });

  const shipments = data?.data || [];
  const pagination = data?.pagination;

  // Filter to completed/cancelled shipments for history
  const historyShipments = shipments.filter(
    s => s.status === 'DELIVERED' || s.status === 'CANCELLED'
  );

  // Calculate stats
  const totalDeliveries = historyShipments.filter(s => s.status === 'DELIVERED').length;
  const totalDistance = historyShipments.reduce((acc, s) => {
    const distance = (s.endOdometer || 0) - (s.startOdometer || 0);
    return acc + (distance > 0 ? distance : 0);
  }, 0);
  const avgRating = 4.7; // Would come from API

  if (isLoading) {
    return <HistoryPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PortalHero
        title="سجل رحلاتك بالتفصيل"
        subtitle="السائق"
        description="راجع التسليمات السابقة، المسافات المقطوعة، والتقييمات بسهولة."
        imageSrc="/brand/driver-hero.png"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">سجل التسليمات</h1>
          <p className="text-muted-foreground">عرض تاريخ جميع الشحنات التي قمت بتسليمها</p>
        </div>
        <Button variant="outline">
          <Download className="ml-2 h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.08),rgba(241,214,178,0.35))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسليمات</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">شحنة مكتملة</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.06),rgba(255,244,230,0.6))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المسافة الإجمالية</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance.toLocaleString('ar-SA')}</div>
            <p className="text-xs text-muted-foreground">كيلومتر</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.06),rgba(255,244,230,0.6))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التقييم</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
            <p className="text-xs text-muted-foreground">من 5 نجوم</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.08),rgba(241,214,178,0.35))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الإنجاز</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">في الوقت المحدد</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/60 bg-card/70">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="البحث عن شحنة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="DELIVERED">مكتملة</SelectItem>
                <SelectItem value="CANCELLED">ملغية</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفترات</SelectItem>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
                <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                <SelectItem value="year">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            سجل الشحنات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyShipments.length > 0 ? (
            <div className="rounded-xl border bg-card/60">
              <Table>
              <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
                <TableRow>
                  <TableHead>رقم الشحنة</TableHead>
                  <TableHead>المسار</TableHead>
                  <TableHead>تاريخ التسليم</TableHead>
                  <TableHead>المسافة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyShipments.map((shipment) => {
                  const distance = (shipment.endOdometer || 0) - (shipment.startOdometer || 0);
                  return (
                    <TableRow key={shipment._id}>
                      <TableCell>
                        <span className="font-mono">#{shipment._id.slice(-8)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span className="truncate max-w-[150px]">
                              {shipment.origin.country || shipment.origin.address.split(',')[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 text-red-500" />
                            <span className="truncate max-w-[150px]">
                              {shipment.destination.country || shipment.destination.address.split(',')[0]}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {shipment.actualDeliveryDate ? new Date(shipment.actualDeliveryDate).toLocaleDateString('ar-SA') : '--'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {distance > 0 ? `${distance.toLocaleString('ar-SA')} كم` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[shipment.status]?.color || 'bg-gray-100'}>
                          {statusConfig[shipment.status]?.label || shipment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>4.8</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/driver/shipments/${shipment._id}`}>
                            عرض
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">لا يوجد سجل</h3>
              <p className="text-muted-foreground">
                ستظهر هنا الشحنات المكتملة عند إتمام التسليمات
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الشهر الحالي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">تسليمات مكتملة</span>
              </div>
              <p className="text-2xl font-bold mt-2">{totalDeliveries}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 text-blue-600">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">كيلومترات</span>
              </div>
              <p className="text-2xl font-bold mt-2">{totalDistance.toLocaleString('ar-SA')}</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 text-yellow-600">
                <Star className="h-5 w-5" />
                <span className="font-medium">التقييم</span>
              </div>
              <p className="text-2xl font-bold mt-2">{avgRating} / 5</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
