'use client';

/**
 * Document List Component
 * Task: T137 [US8] - Document list component
 */

import { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/hooks/use-file-upload';
import { useDownloadDocument, useDeleteDocument } from '@/hooks/use-documents';
import { DocumentPreview } from './document-preview';
import type { Document } from '@/types/entities';
import type { DocumentType } from '@/types/api';

// =============================================================================
// TYPES
// =============================================================================

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  showHeader?: boolean;
  title?: string;
  emptyMessage?: string;
  canDelete?: boolean;
  canDownload?: boolean;
  canPreview?: boolean;
  maxHeight?: string;
  compact?: boolean;
  className?: string;
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
// HELPER FUNCTIONS
// =============================================================================

function getDocumentIcon(mimeType?: string) {
  if (!mimeType) return <File className="h-5 w-5 text-gray-500" />;
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

function getVerificationBadge(isVerified: boolean) {
  if (isVerified) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
        <CheckCircle className="h-3 w-3" />
        موثق
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      في الانتظار
    </Badge>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DocumentList({
  documents,
  isLoading = false,
  showHeader = true,
  title = 'المستندات',
  emptyMessage = 'لا توجد مستندات',
  canDelete = false,
  canDownload = true,
  canPreview = true,
  maxHeight,
  compact = false,
  className,
}: DocumentListProps) {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<Document | null>(null);

  const downloadMutation = useDownloadDocument();
  const deleteMutation = useDeleteDocument();

  const handleDownload = (doc: Document) => {
    downloadMutation.mutate(doc);
  };

  const handleDelete = async () => {
    if (deleteDocument) {
      await deleteMutation.mutateAsync(deleteDocument._id);
      setDeleteDocument(null);
    }
  };

  if (isLoading) {
    return <DocumentListSkeleton showHeader={showHeader} compact={compact} />;
  }

  const content = (
    <>
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className={cn('space-y-2', compact && 'space-y-1')}>
          {documents.map((doc) => (
            <div
              key={doc._id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
                compact && 'p-2'
              )}
            >
              {/* Icon */}
              {getDocumentIcon(doc.mimeType)}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('font-medium truncate', compact ? 'text-sm' : 'text-sm')}>
                    {doc.name}
                  </p>
                  {!compact && getVerificationBadge(doc.isVerified)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}</span>
                  {doc.fileSize && (
                    <>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </>
                  )}
                  {!compact && doc.createdAt && (
                    <>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(doc.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              {compact ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canPreview && (
                      <DropdownMenuItem onClick={() => setPreviewDocument(doc)}>
                        <Eye className="h-4 w-4 ml-2" />
                        معاينة
                      </DropdownMenuItem>
                    )}
                    {canDownload && (
                      <DropdownMenuItem onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4 ml-2" />
                        تحميل
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1">
                  {canPreview && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewDocument(doc)}
                      title="معاينة"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {canDownload && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadMutation.isPending}
                      title="تحميل"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDocument(doc)}
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              {title}
              <Badge variant="secondary" className="text-xs">
                {documents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={cn(!showHeader && 'pt-6')}>
          {maxHeight ? (
            <ScrollArea style={{ maxHeight }} className="pr-4">
              {content}
            </ScrollArea>
          ) : (
            content
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <DocumentPreview
        document={previewDocument}
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDocument} onOpenChange={(open) => !open && setDeleteDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستند</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{deleteDocument?.name}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function DocumentListSkeleton({
  showHeader = true,
  compact = false,
}: {
  showHeader?: boolean;
  compact?: boolean;
}) {
  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
      )}
      <CardContent className={cn(!showHeader && 'pt-6')}>
        <div className={cn('space-y-2', compact && 'space-y-1')}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={cn('flex items-center gap-3 p-3', compact && 'p-2')}>
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default DocumentList;
