'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrokersTable } from '@/components/tables/brokers-table';
import { BrokerForm } from '@/components/forms/broker-form';
import { useBrokers, useCreateBroker, useUpdateBroker, useDeactivateBroker } from '@/hooks/use-brokers';
import type { Broker } from '@/types/entities';
import { Skeleton } from '@/components/ui/skeleton';

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">الوسطاء</h1>
      <p className="text-muted-foreground">إدارة وسطاء الشحن والتخليص الجمركي</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function BrokersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);

  const { data: brokersResponse, isLoading } = useBrokers();
  const createMutation = useCreateBroker();
  const updateMutation = useUpdateBroker();
  const deactivateMutation = useDeactivateBroker();

  const brokers = brokersResponse?.data?.brokers || [];

  const handleCreate = async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      await createMutation.mutateAsync(data);
      setCreateDialogOpen(false);
    } catch {
      // Error toast shown by mutation onError
    }
  };

  const handleUpdate = async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
    if (!selectedBroker) return;
    try {
      await updateMutation.mutateAsync({ id: selectedBroker._id, data });
      setCreateDialogOpen(false);
      setSelectedBroker(null);
    } catch {
      // Error toast shown by mutation onError
    }
  };

  const handleDeactivate = (broker: Broker) => {
    if (confirm(`هل أنت متأكد من إلغاء تفعيل الوسيط "${broker.name}"؟`)) {
      deactivateMutation.mutate(broker._id);
    }
  };

  const handleEdit = (broker: Broker) => {
    setSelectedBroker(broker);
    setCreateDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader />

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة وسيط
            </Button>
          </div>

          <BrokersTable
            brokers={brokers}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
          />
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setSelectedBroker(null);
        }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBroker ? 'تعديل الوسيط' : 'إضافة وسيط جديد'}
            </DialogTitle>
            <DialogDescription>
              {selectedBroker
                ? 'قم بتعديل معلومات الوسيط'
                : 'املأ النموذج لإضافة وسيط جديد'}
            </DialogDescription>
          </DialogHeader>
          <BrokerForm
            broker={selectedBroker || undefined}
            onSubmit={selectedBroker ? handleUpdate : handleCreate}
            onCancel={() => {
              setCreateDialogOpen(false);
              setSelectedBroker(null);
            }}
            isLoading={selectedBroker ? updateMutation.isPending : createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
