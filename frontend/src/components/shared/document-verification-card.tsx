'use client';

import { useState } from 'react';
import {
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Calendar,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Document } from '@/types/entities';

interface DocumentVerificationCardProps {
  document: Document;
  onVerify?: (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => void;
  isVerifying?: boolean;
  showActions?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  COMMERCIAL_INVOICE: 'فاتورة تجارية',
  PACKING_LIST: 'قائمة التعبئة',
  SHIPPING_INVOICE: 'فاتورة الشحن',
  BILL_OF_LADING: 'بوليصة الشحن',
  CUSTOMS_DECLARATION: 'إقرار جمركي',
  CERTIFICATE_OF_ORIGIN: 'شهادة المنشأ',
  INSURANCE_CERTIFICATE: 'شهادة التأمين',
  VEHICLE_REGISTRATION: 'رخصة المركبة',
  DRIVER_LICENSE: 'رخصة القيادة',
  IDENTITY_DOCUMENT: 'مستند هوية',
  PROOF_OF_DELIVERY: 'إثبات التسليم',
  OTHER: 'أخرى',
};

const verificationStatusConfig: Record<
  'verified' | 'pending',
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: {
    label: 'قيد المراجعة',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
  },
  verified: {
    label: 'موثق',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
  },
};

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function DocumentVerificationCard({
  document,
  onVerify,
  isVerifying = false,
  showActions = true,
}: DocumentVerificationCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const verificationKey = document.isVerified ? 'verified' : 'pending';
  const status = verificationStatusConfig[verificationKey];
  const StatusIcon = status.icon;

  const handleVerify = () => {
    onVerify?.(document._id, 'VERIFIED');
  };

  const handleReject = () => {
    onVerify?.(document._id, 'REJECTED', rejectNotes);
    setShowRejectDialog(false);
    setRejectNotes('');
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {documentTypeLabels[document.documentType] || document.documentType}
                </CardTitle>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {document.name}
                </p>
              </div>
            </div>
            <Badge className={status.color}>
              <StatusIcon className="ml-1 h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">تاريخ الرفع:</span>
              <span className="font-medium">{formatDate(document.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">النوع:</span>
              <span className="font-medium">{document.entityType}</span>
            </div>
          </div>

          {document.verificationNotes && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">ملاحظات:</p>
              <p className="text-sm">{document.verificationNotes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="ml-2 h-4 w-4" />
              معاينة
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={document.filePath} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="ml-2 h-4 w-4" />
                فتح
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={document.filePath} download={document.name}>
                <Download className="ml-2 h-4 w-4" />
                تنزيل
              </a>
            </Button>
          </div>

          {showActions && !document.isVerified && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                <CheckCircle2 className="ml-2 h-4 w-4" />
                توثيق
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => setShowRejectDialog(true)}
                disabled={isVerifying}
              >
                <XCircle className="ml-2 h-4 w-4" />
                رفض
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض المستند</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              يرجى إضافة سبب الرفض ليتم إرساله للمستخدم
            </p>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="سبب الرفض..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {documentTypeLabels[document.documentType] || document.documentType}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg border">
            {document.mimeType?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={document.filePath}
                alt={document.name}
                className="w-full h-full object-contain"
              />
            ) : document.mimeType === 'application/pdf' ? (
              <iframe
                src={document.filePath}
                title={document.name}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    لا يمكن معاينة هذا النوع من الملفات
                  </p>
                  <Button asChild className="mt-4">
                    <a href={document.filePath} target="_blank" rel="noopener noreferrer">
                      فتح في نافذة جديدة
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DocumentVerificationCard;
