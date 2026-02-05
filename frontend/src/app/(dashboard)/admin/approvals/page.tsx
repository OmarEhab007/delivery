'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminRegistrationRequests,
  useAdminApproveRegistration,
  useAdminRejectRegistration,
} from '@/hooks/use-admin';
import type { RegistrationRequest } from '@/types/admin';

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function AdminApprovalsPage() {
  const [page, setPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'PENDING'
  );
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useAdminRegistrationRequests({
    page,
    limit: 10,
    state: stateFilter === 'all' ? undefined : stateFilter,
  });

  const approveMutation = useAdminApproveRegistration();
  const rejectMutation = useAdminRejectRegistration();

  const requests = data?.data.requests ?? [];
  const pagination = data?.data.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلبات التسجيل</h1>
        <p className="text-muted-foreground">مراجعة واعتماد طلبات التسجيل الجديدة</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>طلبات التسجيل</CardTitle>
          <Select
            value={stateFilter}
            onValueChange={(value) => {
              setStateFilter(value as typeof stateFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="PENDING">قيد المراجعة</SelectItem>
              <SelectItem value="APPROVED">مقبولة</SelectItem>
              <SelectItem value="REJECTED">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead className="w-[160px] text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا توجد طلبات حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">{request.payload.name}</TableCell>
                      <TableCell>{request.payload.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{request.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            request.state === 'PENDING'
                              ? 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300'
                              : request.state === 'APPROVED'
                              ? 'bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-300'
                              : 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                          }
                        >
                          {request.state}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>
                        {request.state === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                              onClick={() => approveMutation.mutate(request._id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                              onClick={() => {
                                setSelectedRequest(request);
                                setRejectReason('');
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
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

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>سبب الرفض</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              اكتب سبب الرفض لإرساله للمستخدم.
            </p>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض (اختياري)"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  rejectMutation.mutate({
                    id: selectedRequest._id,
                    reason: rejectReason || undefined,
                  });
                }
                setSelectedRequest(null);
              }}
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
