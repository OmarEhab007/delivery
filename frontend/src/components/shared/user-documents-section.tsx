'use client';

/**
 * User/Driver Documents Section
 * Task: T143 [US8] - Integrate document upload into driver registration
 */

import { useState } from 'react';
import { FileText, Upload, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DocumentUpload } from '@/components/forms/document-upload';
import { DocumentList } from '@/components/shared/document-list';
import { useEntityDocuments } from '@/hooks/use-documents';
import type { Document } from '@/types/entities';
import type { DocumentType, UserRole } from '@/types/api';

// =============================================================================
// TYPES
// =============================================================================

interface UserDocumentsSectionProps {
  userId: string;
  userRole?: UserRole;
  canUpload?: boolean;
  canDelete?: boolean;
  defaultOpen?: boolean;
  showUploadSection?: boolean;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DRIVER_DOCUMENT_TYPES: { value: DocumentType; label: string; required?: boolean }[] = [
  { value: 'DRIVER_LICENSE', label: 'رخصة القيادة', required: true },
  { value: 'REGISTRATION', label: 'وثيقة الهوية', required: true },
  { value: 'OTHER', label: 'أخرى' },
];

const TRUCK_OWNER_DOCUMENT_TYPES: { value: DocumentType; label: string; required?: boolean }[] = [
  { value: 'REGISTRATION', label: 'وثيقة الهوية', required: true },
  { value: 'INSURANCE_CERTIFICATE', label: 'شهادة التأمين' },
  { value: 'OTHER', label: 'أخرى' },
];

const MERCHANT_DOCUMENT_TYPES: { value: DocumentType; label: string; required?: boolean }[] = [
  { value: 'REGISTRATION', label: 'وثيقة الهوية' },
  { value: 'OTHER', label: 'أخرى' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getDocumentTypesForRole(role?: UserRole) {
  switch (role) {
    case 'Driver':
      return DRIVER_DOCUMENT_TYPES;
    case 'TruckOwner':
      return TRUCK_OWNER_DOCUMENT_TYPES;
    case 'Merchant':
      return MERCHANT_DOCUMENT_TYPES;
    default:
      return DRIVER_DOCUMENT_TYPES;
  }
}

function checkDocumentExpiry(documents: Document[]): { expired: Document[]; expiringSoon: Document[] } {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expired: Document[] = [];
  const expiringSoon: Document[] = [];

  documents.forEach((doc) => {
    if (doc.expiryDate) {
      const expiryDate = new Date(doc.expiryDate);
      if (expiryDate < now) {
        expired.push(doc);
      } else if (expiryDate < thirtyDaysFromNow) {
        expiringSoon.push(doc);
      }
    }
  });

  return { expired, expiringSoon };
}

function getRoleLabel(role?: UserRole): string {
  switch (role) {
    case 'Driver':
      return 'السائق';
    case 'TruckOwner':
      return 'مالك الشاحنة';
    case 'Merchant':
      return 'التاجر';
    case 'Admin':
      return 'المسؤول';
    default:
      return 'المستخدم';
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UserDocumentsSection({
  userId,
  userRole,
  canUpload = true,
  canDelete = true,
  defaultOpen = true,
  showUploadSection = true,
  className,
}: UserDocumentsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<'documents' | 'upload'>('documents');

  const { data: documentsData, isLoading, refetch } = useEntityDocuments('User', userId);
  const documents = documentsData?.data || [];

  const documentTypes = getDocumentTypesForRole(userRole);

  // Check for expired or expiring documents
  const { expired, expiringSoon } = checkDocumentExpiry(documents);

  // Count by verification status
  const verifiedCount = documents.filter((d) => d.isVerified).length;
  const pendingCount = documents.filter((d) => !d.isVerified).length;

  // Required documents status
  const requiredTypes = documentTypes.filter((t) => t.required).map((t) => t.value);
  const missingRequired = requiredTypes.filter(
    (type) => !documents.some((d) => d.documentType === type)
  );

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
                مستندات {getRoleLabel(userRole)}
                <Badge variant="secondary" className="text-xs">
                  {documents.length}
                </Badge>
                {(expired.length > 0 || missingRequired.length > 0) && (
                  <Badge variant="destructive" className="text-xs">
                    يتطلب إجراء
                  </Badge>
                )}
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
          <CardContent className="space-y-4">
            {/* Alerts for expired or missing documents */}
            {expired.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>مستندات منتهية الصلاحية:</strong>{' '}
                  {expired.map((d) => d.name).join('، ')}
                </AlertDescription>
              </Alert>
            )}

            {expiringSoon.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>مستندات ستنتهي صلاحيتها قريباً:</strong>{' '}
                  {expiringSoon.map((d) => d.name).join('، ')}
                </AlertDescription>
              </Alert>
            )}

            {missingRequired.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>مستندات مطلوبة ناقصة:</strong>{' '}
                  {missingRequired
                    .map((type) => documentTypes.find((t) => t.value === type)?.label)
                    .join('، ')}
                </AlertDescription>
              </Alert>
            )}

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
                    entityType="User"
                    entityId={userId}
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
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">المستندات المطلوبة:</p>
                <div className="flex flex-wrap gap-2">
                  {documentTypes
                    .filter((t) => t.required)
                    .map((docType) => {
                      const hasDocument = documents.some((d) => d.documentType === docType.value);
                      const isExpired = expired.some((d) => d.documentType === docType.value);

                      return (
                        <Badge
                          key={docType.value}
                          variant={hasDocument ? (isExpired ? 'destructive' : 'default') : 'outline'}
                          className={hasDocument && !isExpired ? 'bg-green-100 text-green-800' : ''}
                        >
                          {docType.label}
                          {hasDocument ? (isExpired ? ' ⚠' : ' ✓') : ''}
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

export default UserDocumentsSection;
