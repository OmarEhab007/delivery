'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  type: 'approve' | 'reject';
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
  requireReason?: boolean;
}

const dialogConfig = {
  approve: {
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100 dark:bg-green-900/20',
    confirmColor: 'bg-green-600 hover:bg-green-700',
    confirmText: 'تأكيد الموافقة',
    defaultTitle: 'تأكيد الموافقة',
    defaultDescription: 'هل أنت متأكد من الموافقة على هذا الطلب؟',
  },
  reject: {
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100 dark:bg-red-900/20',
    confirmColor: '',
    confirmText: 'تأكيد الرفض',
    defaultTitle: 'تأكيد الرفض',
    defaultDescription: 'هل أنت متأكد من رفض هذا الطلب؟',
  },
};

export function ApproveDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  type,
  onConfirm,
  isLoading = false,
  requireReason = false,
}: ApproveDialogProps) {
  const [reason, setReason] = useState('');

  const config = dialogConfig[type];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm(type === 'reject' ? reason : undefined);
    setReason('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('');
    }
    onOpenChange(newOpen);
  };

  const isConfirmDisabled = isLoading || (type === 'reject' && requireReason && !reason.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-4">
          <div
            className={cn(
              'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
              config.iconBg
            )}
          >
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>
          <DialogTitle className="text-center">
            {title || config.defaultTitle}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description || config.defaultDescription}
            {itemName && (
              <span className="block font-medium text-foreground mt-1">{itemName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {type === 'reject' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              سبب الرفض {requireReason && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="أدخل سبب الرفض..."
              rows={3}
            />
            {!requireReason && (
              <p className="text-xs text-muted-foreground">اختياري</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            إلغاء
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            variant={type === 'reject' ? 'destructive' : 'default'}
            className={type === 'approve' ? config.confirmColor : ''}
          >
            {isLoading ? 'جاري...' : config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Shorthand components for common use cases
export function ApproveConfirmDialog(
  props: Omit<ApproveDialogProps, 'type'>
) {
  return <ApproveDialog {...props} type="approve" />;
}

export function RejectConfirmDialog(
  props: Omit<ApproveDialogProps, 'type'>
) {
  return <ApproveDialog {...props} type="reject" />;
}

export default ApproveDialog;
