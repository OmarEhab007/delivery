'use client';

/**
 * Document Upload Component with Progress
 * Task: T136 [US8] - Document upload component
 */

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  useFileUpload,
  formatFileSize,
  ALLOWED_ALL_TYPES,
  type UploadedFile,
} from '@/hooks/use-file-upload';
import type { DocumentType, EntityType } from '@/types/api';

// =============================================================================
// TYPES
// =============================================================================

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

interface DocumentUploadProps {
  entityType: EntityType;
  entityId: string;
  documentType?: DocumentType;
  allowDocumentTypeSelection?: boolean;
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'COMMERCIAL_INVOICE', label: 'فاتورة تجارية' },
  { value: 'PACKING_LIST', label: 'قائمة التعبئة' },
  { value: 'SHIPPING_INVOICE', label: 'فاتورة الشحن' },
  { value: 'BILL_OF_LADING', label: 'بوليصة الشحن' },
  { value: 'WAYBILL', label: 'بوليصة النقل' },
  { value: 'CERTIFICATE_OF_ORIGIN', label: 'شهادة المنشأ' },
  { value: 'ACID_PROOF', label: 'إثبات ACID' },
  { value: 'CUSTOMS_DECLARATION', label: 'البيان الجمركي' },
  { value: 'PROOF_OF_DELIVERY', label: 'إثبات التسليم' },
  { value: 'DRIVER_LICENSE', label: 'رخصة القيادة' },
  { value: 'VEHICLE_REGISTRATION', label: 'رخصة السيارة' },
  { value: 'INSURANCE_CERTIFICATE', label: 'شهادة التأمين' },
  { value: 'HAZARDOUS_MATERIALS_CERT', label: 'شهادة المواد الخطرة' },
  { value: 'PAYMENT_RECEIPT', label: 'إيصال الدفع' },
  { value: 'REGISTRATION', label: 'وثيقة تسجيل' },
  { value: 'OTHER', label: 'أخرى' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function DocumentUpload({
  entityType,
  entityId,
  documentType: defaultDocumentType,
  allowDocumentTypeSelection = true,
  allowedTypes = ALLOWED_ALL_TYPES,
  maxFileSize = 10 * 1024 * 1024,
  maxFiles = 5,
  onUploadComplete,
  onError,
  className,
  disabled = false,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(
    defaultDocumentType || 'OTHER'
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, isUploading } = useFileUpload({
    maxFileSize,
    allowedTypes,
    onError,
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || disabled) return;

      const newFiles: UploadingFile[] = Array.from(selectedFiles)
        .slice(0, maxFiles - files.length)
        .map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          progress: 0,
          status: 'pending' as const,
        }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Upload files sequentially
      const uploadedFiles: UploadedFile[] = [];

      for (const uploadingFile of newFiles) {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadingFile.id ? { ...f, status: 'uploading' } : f))
        );

        try {
          const result = await upload(uploadingFile.file, {
            entityType,
            entityId,
            documentType: selectedDocumentType,
            name: uploadingFile.file.name,
          });

          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? { ...f, status: 'success', progress: 100, uploadedFile: result }
                : f
            )
          );

          uploadedFiles.push(result);
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? {
                    ...f,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'فشل رفع الملف',
                  }
                : f
            )
          );
        }
      }

      if (uploadedFiles.length > 0) {
        onUploadComplete?.(uploadedFiles);
      }
    },
    [files.length, maxFiles, upload, entityType, entityId, selectedDocumentType, onUploadComplete, disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const successfulUploads = files.filter((f) => f.status === 'success');
  const canUploadMore = files.length < maxFiles && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Document Type Selection */}
      {allowDocumentTypeSelection && (
        <div className="space-y-2">
          <Label>نوع المستند</Label>
          <Select
            value={selectedDocumentType}
            onValueChange={(value) => setSelectedDocumentType(value as DocumentType)}
            disabled={disabled || isUploading}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع المستند" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Drop Zone */}
      {canUploadMore && (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <CardContent className="py-8 flex flex-col items-center justify-center text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              اسحب وأفلت الملفات هنا أو انقر للاختيار
            </p>
            <p className="text-xs text-muted-foreground">
              الحد الأقصى {formatFileSize(maxFileSize)} لكل ملف
            </p>
            <p className="text-xs text-muted-foreground">
              {maxFiles - files.length} ملفات متبقية
            </p>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">الملفات ({files.length})</p>
            {files.length > 1 && (
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={isUploading}>
                مسح الكل
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.file.type)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file.size)}
                    </p>

                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    )}

                    {file.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">{file.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'pending' && (
                      <Badge variant="secondary">في الانتظار</Badge>
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      disabled={file.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary */}
          {successfulUploads.length > 0 && (
            <p className="text-sm text-green-600">
              تم رفع {successfulUploads.length} ملف بنجاح
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
