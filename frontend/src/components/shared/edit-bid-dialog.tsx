'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, XCircle, Loader2, DollarSign, FileText } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApplicationStatusBadge } from './status-badge';
import type { Application } from '@/types/entities';

const editBidSchema = z.object({
  price: z.number().min(1, 'يرجى إدخال السعر'),
  currency: z.string(),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});

type EditBidFormData = z.infer<typeof editBidSchema>;

interface EditBidDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: EditBidFormData) => Promise<void>;
  isLoading?: boolean;
}

interface CancelBidDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

function formatCurrency(amount: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EditBidDialog({
  application,
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: EditBidDialogProps) {
  const form = useForm<EditBidFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editBidSchema) as any,
    defaultValues: {
      price: application?.bidDetails.price || 0,
      currency: application?.bidDetails.currency || 'SAR',
      notes: application?.bidDetails.notes || '',
      validUntil: application?.bidDetails.validUntil?.split('T')[0] || '',
    },
  });

  // Reset form when application changes
  if (application && form.getValues('price') !== application.bidDetails.price) {
    form.reset({
      price: application.bidDetails.price,
      currency: application.bidDetails.currency,
      notes: application.bidDetails.notes || '',
      validUntil: application.bidDetails.validUntil?.split('T')[0] || '',
    });
  }

  const handleSubmit = async (data: EditBidFormData) => {
    if (!application) return;
    await onSave(application._id, data);
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>تعديل العرض</DialogTitle>
              <DialogDescription>
                تعديل السعر والملاحظات للعرض #{application._id.slice(-8)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Application Info */}
        <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">السعر الحالي</span>
            <span className="font-semibold">
              {formatCurrency(application.bidDetails.price, application.bidDetails.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">الحالة</span>
            <ApplicationStatusBadge status={application.status} size="sm" />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      السعر الجديد
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SAR">ريال سعودي</SelectItem>
                        <SelectItem value="USD">دولار أمريكي</SelectItem>
                        <SelectItem value="AED">درهم إماراتي</SelectItem>
                        <SelectItem value="EGP">جنيه مصري</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صالح حتى</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    ملاحظات
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أضف أي ملاحظات..."
                      className="resize-none"
                      rows={2}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CancelBidDialog({
  application,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CancelBidDialogProps) {
  if (!application) return null;

  const handleConfirm = async () => {
    await onConfirm(application._id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle>إلغاء العرض</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من إلغاء هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Application Info */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">رقم العرض</span>
            <span className="font-mono">#{application._id.slice(-8)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">السعر</span>
            <span className="font-semibold">
              {formatCurrency(application.bidDetails.price, application.bidDetails.currency)}
            </span>
          </div>
          {application.assignedTruck && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الشاحنة</span>
              <span>{application.assignedTruck.plateNumber}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>تراجع</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تأكيد الإلغاء
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default EditBidDialog;
