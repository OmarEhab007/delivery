'use client';

/**
 * Document Preview Dialog
 * Task: T138 [US8] - Document preview dialog
 */

import { useState } from 'react';
import Image from 'next/image';
import {
  FileText,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatFileSize } from '@/hooks/use-file-upload';
import { useDownloadDocument } from '@/hooks/use-documents';
import { API_BASE_URL } from '@/lib/api/endpoints';
import type { Document } from '@/types/entities';
import type { DocumentType } from '@/types/api';

// =============================================================================
// TYPES
// =============================================================================

interface DocumentPreviewProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  COMMERCIAL_INVOICE: 'فاتورة تجارية',
  PACKING_LIST: 'قائمة التعبئة',
  SHIPPING_INVOICE: 'فاتورة الشحن',
  BILL_OF_LADING: 'بوليصة الشحن',
  WAYBILL: 'بوليصة النقل',
  CERTIFICATE_OF_ORIGIN: 'شهادة المنشأ',
  ACID_PROOF: 'إثبات ACID',
  CUSTOMS_DECLARATION: 'البيان الجمركي',
  PROOF_OF_DELIVERY: 'إثبات التسليم',
  DRIVER_LICENSE: 'رخصة القيادة',
  VEHICLE_REGISTRATION: 'رخصة السيارة',
  INSURANCE_CERTIFICATE: 'شهادة التأمين',
  HAZARDOUS_MATERIALS_CERT: 'شهادة المواد الخطرة',
  PAYMENT_RECEIPT: 'إيصال الدفع',
  REGISTRATION: 'وثيقة تسجيل',
  OTHER: 'أخرى',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function DocumentPreview({ document, open, onOpenChange }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const downloadMutation = useDownloadDocument();

  if (!document) return null;

  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';
  const canPreviewInline = isImage || isPdf;

  const fileUrl = document.filePath?.startsWith('http')
    ? document.filePath
    : `${API_BASE_URL}${document.filePath}`;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = () => {
    downloadMutation.mutate(document);
  };

  const handleOpenExternal = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.name}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType}
            </Badge>
            {document.fileSize && <span>{formatFileSize(document.fileSize)}</span>}
            {document.createdAt && (
              <span>
                {formatDistanceToNow(new Date(document.createdAt), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Verification Status */}
        <div className="flex items-center justify-between px-1 shrink-0">
          <div className="flex items-center gap-2">
            {document.isVerified ? (
              <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
                <CheckCircle className="h-3 w-3" />
                موثق
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                في انتظار التوثيق
              </Badge>
            )}
            {document.verificationDate && (
              <span className="text-xs text-muted-foreground">
                تم التوثيق{' '}
                {formatDistanceToNow(new Date(document.verificationDate), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {isImage && (
              <>
                <Button variant="ghost" size="icon" onClick={handleZoomOut} title="تصغير">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} title="تكبير">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleRotate} title="تدوير">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-2" />
              </>
            )}
            <Button variant="ghost" size="icon" onClick={handleOpenExternal} title="فتح في نافذة جديدة">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              title="تحميل"
            >
              {downloadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator className="shrink-0" />

        {/* Preview Area */}
        <ScrollArea className="flex-1 relative">
          <div className="min-h-full flex items-center justify-center p-4">
            {canPreviewInline ? (
              <>
                {isImage && (
                  <div
                    className="relative transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  >
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                    {hasError ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mb-2" />
                        <p className="text-sm text-muted-foreground">فشل تحميل الصورة</p>
                        <Button variant="link" onClick={handleOpenExternal} className="mt-2">
                          فتح في نافذة جديدة
                        </Button>
                      </div>
                    ) : (
                      <Image
                        src={fileUrl}
                        alt={document.name}
                        width={800}
                        height={600}
                        className="max-w-full h-auto object-contain"
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                          setIsLoading(false);
                          setHasError(true);
                        }}
                        unoptimized
                      />
                    )}
                  </div>
                )}

                {isPdf && (
                  <iframe
                    src={`${fileUrl}#toolbar=0`}
                    className="w-full h-[70vh] border-0 rounded-lg"
                    title={document.name}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">{document.name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  لا يمكن معاينة هذا النوع من الملفات
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} disabled={downloadMutation.isPending}>
                    {downloadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Download className="h-4 w-4 ml-2" />
                    )}
                    تحميل الملف
                  </Button>
                  <Button variant="outline" onClick={handleOpenExternal}>
                    <ExternalLink className="h-4 w-4 ml-2" />
                    فتح في نافذة جديدة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Document Details */}
        {document.description && (
          <>
            <Separator className="shrink-0" />
            <div className="p-4 bg-muted/50 rounded-lg shrink-0">
              <p className="text-sm font-medium mb-1">الوصف</p>
              <p className="text-sm text-muted-foreground">{document.description}</p>
            </div>
          </>
        )}

        {document.verificationNotes && (
          <div className="p-4 bg-muted/50 rounded-lg shrink-0">
            <p className="text-sm font-medium mb-1">ملاحظات التوثيق</p>
            <p className="text-sm text-muted-foreground">{document.verificationNotes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DocumentPreview;
