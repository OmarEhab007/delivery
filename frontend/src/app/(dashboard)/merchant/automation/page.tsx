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
import { AutomationRulesTable } from '@/components/tables/automation-rules-table';
import { AutomationRuleForm } from '@/components/forms/automation-rule-form';
import {
  useAutomationRules,
  useCreateAutomationRule,
  useUpdateAutomationRule,
} from '@/hooks/use-automation';
import type { AutomationRule } from '@/types/entities';
import type { AutomationRuleFormData } from '@/lib/validations';

export default function AutomationPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const { data: rulesResponse, isLoading } = useAutomationRules();
  const createMutation = useCreateAutomationRule();
  const updateMutation = useUpdateAutomationRule();

  const rules = rulesResponse?.data || [];

  const handleCreate = async (data: AutomationRuleFormData) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateDialogOpen(false);
    } catch {
      // Error toast shown by mutation onError
    }
  };

  const handleEdit = async (data: AutomationRuleFormData) => {
    if (!editingRule) return;
    try {
      await updateMutation.mutateAsync({ id: editingRule._id, data });
      setEditingRule(null);
    } catch {
      // Error toast shown by mutation onError
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { active } });
    } catch {
      // Error toast shown by mutation onError
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">قواعد التشغيل الآلي</h1>
          <p className="mt-2 text-muted-foreground">
            إدارة القواعد التلقائية للتنبيهات والتصعيد
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إنشاء قاعدة
        </Button>
      </div>

      {/* Rules Table */}
      <AutomationRulesTable
        rules={rules}
        isLoading={isLoading}
        onToggleActive={handleToggleActive}
        onEdit={setEditingRule}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء قاعدة جديدة</DialogTitle>
            <DialogDescription>
              أضف قاعدة تلقائية لإرسال إشعارات أو تصعيد المشكلات
            </DialogDescription>
          </DialogHeader>
          <AutomationRuleForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل القاعدة</DialogTitle>
            <DialogDescription>
              تحديث إعدادات القاعدة التلقائية
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <AutomationRuleForm
              rule={editingRule}
              onSubmit={handleEdit}
              onCancel={() => setEditingRule(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
