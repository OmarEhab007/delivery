'use client';

import { useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { documentsApi } from '@/lib/api';
import type { Document } from '@/types/entities';
import { toast } from 'sonner';

const entityOptions = [
  { value: 'Shipment', label: 'شحنة' },
  { value: 'Truck', label: 'شاحنة' },
  { value: 'User', label: 'مستخدم' },
  { value: 'Application', label: 'طلب' },
];

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function AdminDocumentsPage() {
  const [entityType, setEntityType] = useState('Shipment');
  const [entityId, setEntityId] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      documentsApi.verify(id, { verified }),
    onSuccess: (_, variables) => {
      setDocuments((docs) =>
        docs.map((doc) => (doc._id === variables.id ? { ...doc, isVerified: variables.verified } : doc))
      );
      toast.success('تم تحديث حالة المستند');
    },
    onError: (error: Error) => {
      toast.error('تعذر تحديث المستند', { description: error.message });
    },
  });

  const handleSearch = async () => {
    if (!entityId) {
      toast.error('يرجى إدخال رقم الكيان');
      return;
    }

    setLoading(true);
    try {
      const response = await documentsApi.listByEntity(entityType, entityId);
      setDocuments(response.data || []);
    } catch (error) {
      toast.error('تعذر جلب المستندات', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة المستندات</h1>
        <p className="text-muted-foreground">البحث عن المستندات والتحقق منها</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البحث عن مستندات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الكيان" />
              </SelectTrigger>
              <SelectContent>
                {entityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="رقم الكيان"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="ml-2 h-4 w-4" />
              بحث
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستند</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الرفع</TableHead>
                  <TableHead className="w-[140px] text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      لا توجد مستندات
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>
                        {doc.isVerified ? (
                          <Badge className="bg-green-500/10 text-green-600">موثق</Badge>
                        ) : (
                          <Badge variant="secondary">غير موثق</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(doc.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            verifyMutation.mutate({ id: doc._id, verified: !doc.isVerified })
                          }
                        >
                          {doc.isVerified ? 'إلغاء التوثيق' : 'توثيق'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
