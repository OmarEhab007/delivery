'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Application } from '@/types/entities';

const rejectSchema = z.object({
  reason: z.string().min(10, 'يرجى إدخال سبب الرفض (10 أحرف على الأقل)'),
});

type RejectFormData = z.infer<typeof rejectSchema>;

interface BidActionDialogProps {
  application: Application | null;
  action: 'accept' | 'reject' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

function formatCurrency(amount: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function BidActionDialog({
  application,
  action,
  open,
  onOpenChange,
  onAccept,
  onReject,
  isLoading = false,
}: BidActionDialogProps) {
  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      reason: '',
    },
  });

  const handleAccept = async () => {
    if (!application) return;
    await onAccept(application._id);
  };

  const handleReject = async (data: RejectFormData) => {
    if (!application) return;
    await onReject(application._id, data.reason);
  };

  if (!application) return null;

  const isAccept = action === 'accept';
  const Icon = isAccept ? CheckCircle2 : XCircle;
  const title = isAccept ? 'قبول العرض' : 'رفض العرض';
  const description = isAccept
    ? 'هل أنت متأكد من قبول هذا العرض؟ سيتم رفض جميع العروض الأخرى تلقائياً.'
    : 'يرجى إدخال سبب الرفض لإعلام مقدم العرض.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isAccept ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Application Summary */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">مقدم العرض</span>
            <span className="font-medium">{application.owner?.name || '--'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">السعر المقترح</span>
            <span className="font-semibold text-primary">
              {formatCurrency(application.bidDetails.price, application.bidDetails.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الشاحنة</span>
            <span className="font-medium">
              {application.assignedTruck?.model} - {application.assignedTruck?.plateNumber}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">السائق</span>
            <span className="font-medium">{application.driver?.name || '--'}</span>
          </div>
          {application.bidDetails.notes && (
            <div className="pt-2 border-t">
              <span className="text-sm text-muted-foreground block mb-1">ملاحظات</span>
              <p className="text-sm">{application.bidDetails.notes}</p>
            </div>
          )}
        </div>

        {isAccept ? (
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد القبول
            </Button>
          </DialogFooter>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleReject)} className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سبب الرفض</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="أدخل سبب رفض العرض..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
                <Button type="submit" variant="destructive" disabled={isLoading}>
                  {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  تأكيد الرفض
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BidActionDialog;
