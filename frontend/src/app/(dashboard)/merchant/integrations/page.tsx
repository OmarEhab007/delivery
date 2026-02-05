'use client';

import { useState } from 'react';
import { Plus, Key, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { WebhooksTable } from '@/components/tables/webhooks-table';
import { WebhookForm } from '@/components/forms/webhook-form';
import {
  useIntegrationCredentials,
  useCreateCredential,
  useWebhooks,
  useCreateWebhook,
} from '@/hooks/use-integrations';
import type { WebhookFormData } from '@/lib/validations';
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const [isCreateCredentialDialogOpen, setIsCreateCredentialDialogOpen] = useState(false);
  const [isCreateWebhookDialogOpen, setIsCreateWebhookDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const { data: credentialsResponse, isLoading: credentialsLoading } = useIntegrationCredentials();
  const { data: webhooksResponse, isLoading: webhooksLoading } = useWebhooks();
  const createCredentialMutation = useCreateCredential();
  const createWebhookMutation = useCreateWebhook();

  const credentials = credentialsResponse?.data || [];
  const webhooks = webhooksResponse?.data || [];

  const handleCreateCredential = async () => {
    const result = await createCredentialMutation.mutateAsync({
      name: 'API Key',
      scopes: ['shipments:read', 'shipments:write', 'webhooks:read', 'webhooks:write'],
    });
    setNewApiKey(result.data.apiKey);
    setIsCreateCredentialDialogOpen(false);
  };

  const handleCreateWebhook = async (data: WebhookFormData) => {
    await createWebhookMutation.mutateAsync(data);
    setIsCreateWebhookDialogOpen(false);
  };

  const handleCopyApiKey = async () => {
    if (!newApiKey) return;
    try {
      await navigator.clipboard.writeText(newApiKey);
      setCopiedKey(true);
      toast.success('تم نسخ المفتاح');
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast.error('فشل في نسخ المفتاح');
    }
  };

  const handleCloseKeyDialog = () => {
    setNewApiKey(null);
    setCopiedKey(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التكاملات</h1>
        <p className="mt-2 text-muted-foreground">
          إدارة مفاتيح API والـ webhooks
        </p>
      </div>

      {/* API Credentials Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">مفاتيح API</h2>
            <p className="text-sm text-muted-foreground">
              استخدم هذه المفاتيح للوصول إلى API
            </p>
          </div>
          <Button onClick={() => setIsCreateCredentialDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            إنشاء مفتاح جديد
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {credentialsLoading ? (
            <>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </>
          ) : credentials.length === 0 ? (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>لا توجد مفاتيح</CardTitle>
                <CardDescription>
                  أنشئ مفتاح API للبدء في استخدام التكامل
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            credentials.map((credential) => (
              <Card key={credential._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {credential.name}
                    </CardTitle>
                    <Badge variant={credential.active ? 'default' : 'secondary'}>
                      {credential.active ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>
                  <CardDescription>
                    آخر استخدام: {formatDate(credential.lastUsedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">بادئة المفتاح</Label>
                    <Input
                      value={credential.apiKeyPrefix + '••••••••••••'}
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Webhooks</h2>
            <p className="text-sm text-muted-foreground">
              استقبال إشعارات عن الأحداث في الوقت الفعلي
            </p>
          </div>
          <Button onClick={() => setIsCreateWebhookDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة Webhook
          </Button>
        </div>

        <WebhooksTable webhooks={webhooks} isLoading={webhooksLoading} />
      </div>

      {/* Create Credential Dialog */}
      <Dialog open={isCreateCredentialDialogOpen} onOpenChange={setIsCreateCredentialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء مفتاح API جديد</DialogTitle>
            <DialogDescription>
              سيتم عرض المفتاح مرة واحدة فقط. احفظه في مكان آمن.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              سيتم إنشاء مفتاح API بجميع الصلاحيات اللازمة للتكامل مع نظامك.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateCredentialDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreateCredential}
                disabled={createCredentialMutation.isPending}
              >
                إنشاء المفتاح
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show New API Key Dialog */}
      <Dialog open={!!newApiKey} onOpenChange={handleCloseKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مفتاح API الجديد</DialogTitle>
            <DialogDescription>
              احفظ هذا المفتاح في مكان آمن. لن تتمكن من رؤيته مرة أخرى.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>المفتاح</Label>
              <div className="flex gap-2">
                <Input
                  value={newApiKey || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyApiKey}
                >
                  {copiedKey ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCloseKeyDialog}>
                تم
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog open={isCreateWebhookDialogOpen} onOpenChange={setIsCreateWebhookDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة Webhook جديد</DialogTitle>
            <DialogDescription>
              أضف endpoint لاستقبال إشعارات الأحداث
            </DialogDescription>
          </DialogHeader>
          <WebhookForm
            onSubmit={handleCreateWebhook}
            onCancel={() => setIsCreateWebhookDialogOpen(false)}
            isLoading={createWebhookMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
