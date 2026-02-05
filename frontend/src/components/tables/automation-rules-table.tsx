'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Edit, MoreHorizontal, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AutomationRule } from '@/types/entities';

interface AutomationRulesTableProps {
  rules: AutomationRule[];
  isLoading?: boolean;
  onToggleActive?: (id: string, active: boolean) => void;
  onEdit?: (rule: AutomationRule) => void;
}

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-10" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

const triggerTypeLabels: Record<string, string> = {
  delay: 'تأخير في التسليم',
  'missing-update': 'عدم تحديث الموقع',
};

const actionLabels: Record<string, string> = {
  notify: 'إرسال إشعار',
  escalate: 'تصعيد للإدارة',
};

export function AutomationRulesTable({
  rules,
  isLoading = false,
  onToggleActive,
  onEdit,
}: AutomationRulesTableProps) {
  return (
    <div className="rounded-xl border bg-card/60 shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>نوع المحفز</TableHead>
            <TableHead>العتبة</TableHead>
            <TableHead>الإجراء</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>آخر تفعيل</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : rules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="border-0">
                <EmptyState
                  icon={Zap}
                  title="لا توجد قواعد"
                  description="لم يتم إنشاء أي قواعد تشغيل آلي بعد. قم بإنشاء قاعدة جديدة للبدء"
                />
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule._id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {triggerTypeLabels[rule.triggerType] || rule.triggerType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rule.threshold} ساعات
                </TableCell>
                <TableCell>
                  <Badge variant={rule.action === 'escalate' ? 'destructive' : 'default'}>
                    {actionLabels[rule.action] || rule.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={rule.active}
                    onCheckedChange={(checked) => onToggleActive?.(rule._id, checked)}
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(rule.lastTriggeredAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">القائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(rule)}>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default AutomationRulesTable;
