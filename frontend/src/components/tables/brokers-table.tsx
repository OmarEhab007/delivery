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
  Edit,
  Ban,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Broker } from '@/types/entities';

interface BrokersTableProps {
  brokers: Broker[];
  isLoading?: boolean;
  onEdit?: (broker: Broker) => void;
  onDeactivate?: (broker: Broker) => void;
  onSearch?: (query: string) => void;
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function BrokersTable({
  brokers,
  isLoading = false,
  onEdit,
  onDeactivate,
  onSearch,
}: BrokersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
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
                placeholder="بحث بالاسم أو رقم الترخيص..."
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
              <TableHead>رقم الترخيص</TableHead>
              <TableHead>الدول المخدومة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : brokers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="border-0">
                  <EmptyState
                    icon={Users}
                    title="لا توجد وسطاء"
                    description="لم يتم إضافة أي وسطاء بعد. قم بإضافة وسيط جديد للبدء"
                  />
                </TableCell>
              </TableRow>
            ) : (
              brokers.map((broker) => (
                <TableRow key={broker._id}>
                  <TableCell className="font-medium">{broker.name}</TableCell>
                  <TableCell className="font-mono text-xs">{broker.licenseNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {broker.countriesServed.length > 0 ? (
                        broker.countriesServed.slice(0, 3).map((country) => (
                          <Badge key={country} variant="outline" className="text-xs">
                            {country}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">لا توجد دول</span>
                      )}
                      {broker.countriesServed.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{broker.countriesServed.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={broker.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={
                        broker.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
                          : ''
                      }
                    >
                      {broker.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(broker.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(broker)}>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                        )}
                        {onDeactivate && broker.status === 'ACTIVE' && (
                          <DropdownMenuItem
                            onClick={() => onDeactivate(broker)}
                            className="text-destructive"
                          >
                            <Ban className="ml-2 h-4 w-4" />
                            إلغاء التفعيل
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default BrokersTable;
