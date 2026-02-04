'use client';

/**
 * Shipment Documents Section
 * Task: T141 [US8] - Integrate document upload into shipment forms
 */

import { useState } from 'react';
import { FileText, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from '@/components/forms/document-upload';
import { DocumentList } from '@/components/shared/document-list';
import { useEntityDocuments } from '@/hooks/use-documents';
import type { DocumentType } from '@/types/api';

// =============================================================================
// TYPES
// =============================================================================

interface ShipmentDocumentsSectionProps {
  shipmentId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  defaultOpen?: boolean;
  showUploadSection?: boolean;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SHIPMENT_DOCUMENT_TYPES: { value: DocumentType; label: string; required?: boolean }[] = [
  { value: 'COMMERCIAL_INVOICE', label: 'فاتورة تجارية', required: true },
  { value: 'PACKING_LIST', label: 'قائمة التعبئة', required: true },
  { value: 'SHIPPING_INVOICE', label: 'فاتورة الشحن' },
  { value: 'BILL_OF_LADING', label: 'بوليصة الشحن' },
  { value: 'WAYBILL', label: 'بوليصة النقل' },
  { value: 'CERTIFICATE_OF_ORIGIN', label: 'شهادة المنشأ' },
  { value: 'INSURANCE_CERTIFICATE', label: 'شهادة التأمين' },
  { value: 'CUSTOMS_DECLARATION', label: 'البيان الجمركي' },
  { value: 'PROOF_OF_DELIVERY', label: 'إثبات التسليم' },
  { value: 'PAYMENT_RECEIPT', label: 'إيصال الدفع' },
  { value: 'OTHER', label: 'أخرى' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ShipmentDocumentsSection({
  shipmentId,
  canUpload = true,
  canDelete = true,
  defaultOpen = true,
  showUploadSection = true,
  className,
}: ShipmentDocumentsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<'documents' | 'upload'>('documents');

  const { data: documentsData, isLoading, refetch } = useEntityDocuments('Shipment', shipmentId);
  const documents = documentsData?.data || [];

  // Count by verification status
  const verifiedCount = documents.filter((d) => d.isVerified).length;
  const pendingCount = documents.filter((d) => !d.isVerified).length;

  // Count by required documents
  const requiredTypes = SHIPMENT_DOCUMENT_TYPES.filter((t) => t.required).map((t) => t.value);

  const handleUploadComplete = () => {
    refetch();
    setActiveTab('documents');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                مستندات الشحنة
                <Badge variant="secondary" className="text-xs">
                  {documents.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {documents.length > 0 && (
                  <div className="flex gap-1">
                    {verifiedCount > 0 && (
                      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                        {verifiedCount} موثق
                      </Badge>
                    )}
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {pendingCount} في الانتظار
                      </Badge>
                    )}
                  </div>
                )}
                <Button variant="ghost" size="sm">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {showUploadSection && canUpload ? (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'documents' | 'upload')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="documents">المستندات المرفقة</TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 ml-2" />
                    رفع مستند
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="documents">
                  <DocumentList
                    documents={documents}
                    isLoading={isLoading}
                    showHeader={false}
                    canDelete={canDelete}
                    emptyMessage="لم يتم إرفاق أي مستندات بعد"
                    maxHeight="400px"
                  />
                </TabsContent>

                <TabsContent value="upload">
                  <DocumentUpload
                    entityType="Shipment"
                    entityId={shipmentId}
                    allowDocumentTypeSelection={true}
                    onUploadComplete={handleUploadComplete}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <DocumentList
                documents={documents}
                isLoading={isLoading}
                showHeader={false}
                canDelete={canDelete}
                emptyMessage="لم يتم إرفاق أي مستندات بعد"
                maxHeight="400px"
              />
            )}

            {/* Required Documents Checklist */}
            {requiredTypes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">المستندات المطلوبة:</p>
                <div className="flex flex-wrap gap-2">
                  {SHIPMENT_DOCUMENT_TYPES.filter((t) => t.required).map((docType) => {
                    const hasDocument = documents.some((d) => d.documentType === docType.value);
                    return (
                      <Badge
                        key={docType.value}
                        variant={hasDocument ? 'default' : 'outline'}
                        className={hasDocument ? 'bg-green-100 text-green-800' : ''}
                      >
                        {docType.label}
                        {hasDocument ? ' ✓' : ''}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default ShipmentDocumentsSection;
