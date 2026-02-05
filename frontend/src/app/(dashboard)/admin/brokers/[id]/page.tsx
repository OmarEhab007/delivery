'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ban, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrokerForm } from '@/components/forms/broker-form';
import { useBroker, useUpdateBroker, useDeactivateBroker } from '@/hooks/use-brokers';

interface PageProps {
  params: Promise<{ id: string }>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function BrokerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: brokerResponse, isLoading } = useBroker(id);
  const updateMutation = useUpdateBroker();
  const deactivateMutation = useDeactivateBroker();

  const broker = brokerResponse?.data?.broker;

  const handleUpdate = async (data: Parameters<typeof updateMutation.mutateAsync>[0]['data']) => {
    await updateMutation.mutateAsync({ id, data });
    setEditDialogOpen(false);
  };

  const handleDeactivate = () => {
    if (confirm(`هل أنت متأكد من إلغاء تفعيل الوسيط "${broker?.name}"؟`)) {
      deactivateMutation.mutate(id, {
        onSuccess: () => {
          router.push('/admin/brokers');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لم يتم العثور على الوسيط</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/brokers')}
            className="mb-2"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة إلى القائمة
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{broker.name}</h1>
          <p className="text-muted-foreground">تفاصيل الوسيط</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
          {broker.status === 'ACTIVE' && (
            <Button variant="destructive" onClick={handleDeactivate}>
              <Ban className="ml-2 h-4 w-4" />
              إلغاء التفعيل
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">اسم الوسيط</p>
                <p className="text-lg font-semibold">{broker.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">رقم الترخيص</p>
                <p className="text-lg font-mono">{broker.licenseNumber}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">الحالة</p>
              <Badge
                variant={broker.status === 'ACTIVE' ? 'default' : 'secondary'}
                className={
                  broker.status === 'ACTIVE'
                    ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
                    : ''
                }
              >
                {broker.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Countries Served */}
        <Card>
          <CardHeader>
            <CardTitle>الدول المخدومة</CardTitle>
          </CardHeader>
          <CardContent>
            {broker.countriesServed.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {broker.countriesServed.map((country) => (
                  <Badge key={country} variant="outline">
                    {country}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد دول محددة</p>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الاتصال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</p>
                <p className="text-lg">
                  {broker.contacts?.email || (
                    <span className="text-sm text-muted-foreground">غير محدد</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">رقم الهاتف</p>
                <p className="text-lg">
                  {broker.contacts?.phone || (
                    <span className="text-sm text-muted-foreground">غير محدد</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {broker.notes && (
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{broker.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات إضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">تاريخ الإنشاء</span>
              <span>{new Date(broker.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">آخر تحديث</span>
              <span>{new Date(broker.updatedAt).toLocaleDateString('ar-SA')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الوسيط</DialogTitle>
            <DialogDescription>قم بتعديل معلومات الوسيط</DialogDescription>
          </DialogHeader>
          <BrokerForm
            broker={broker}
            onSubmit={handleUpdate}
            onCancel={() => setEditDialogOpen(false)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
