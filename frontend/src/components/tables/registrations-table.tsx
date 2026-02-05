'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  MoreHorizontal,
  Search,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { User } from '@/types/entities';

interface RegistrationsTableProps {
  registrations: User[];
  isLoading?: boolean;
  onApprove?: (user: User) => void;
  onReject?: (user: User, reason: string) => void;
  onSearch?: (query: string) => void;
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    Merchant: 'تاجر',
    TruckOwner: 'مالك شاحنة',
    Driver: 'سائق',
    Admin: 'مدير',
  };
  return labels[role] || role;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
          قيد الانتظار
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
          مقبول
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
          مرفوض
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function RegistrationsTable({
  registrations,
  isLoading = false,
  onApprove,
  onReject,
  onSearch,
}: RegistrationsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [approveDialog, setApproveDialog] = useState<User | null>(null);
  const [rejectDialog, setRejectDialog] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleApprove = () => {
    if (approveDialog) {
      onApprove?.(approveDialog);
      setApproveDialog(null);
    }
  };

  const handleReject = () => {
    if (rejectDialog && rejectReason.trim()) {
      onReject?.(rejectDialog, rejectReason);
      setRejectDialog(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      {onSearch && (
        <div className="rounded-xl border bg-card/60 p-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              بحث
            </Button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card/60 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>تاريخ التقديم</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="border-0">
                  <EmptyState
                    icon={FileText}
                    title="لا توجد طلبات تسجيل"
                    description="لا توجد طلبات تسجيل جديدة في الوقت الحالي"
                  />
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((registration) => (
                <TableRow key={registration._id}>
                  <TableCell className="font-medium">{registration.name}</TableCell>
                  <TableCell className="text-sm">{registration.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getRoleLabel(registration.role)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(registration.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(registration.approvalStatus)}</TableCell>
                  <TableCell>
                    {registration.approvalStatus === 'PENDING' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">القائمة</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setApproveDialog(registration)}>
                            <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                            الموافقة
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setRejectDialog(registration)}
                            className="text-destructive"
                          >
                            <XCircle className="ml-2 h-4 w-4" />
                            الرفض
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الموافقة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من الموافقة على طلب التسجيل لـ {approveDialog?.name}؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>
              إلغاء
            </Button>
            <Button onClick={handleApprove}>موافقة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض طلب التسجيل</DialogTitle>
            <DialogDescription>
              يرجى تقديم سبب رفض طلب التسجيل لـ {rejectDialog?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">سبب الرفض</Label>
              <Textarea
                id="reason"
                placeholder="اكتب السبب هنا..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
              رفض الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RegistrationsTable;
