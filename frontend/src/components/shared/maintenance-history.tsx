'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, Calendar, DollarSign, Gauge, FileText } from 'lucide-react';
import type { MaintenanceRecord } from '@/types/entities';

interface MaintenanceHistoryProps {
  records: MaintenanceRecord[];
  onAddRecord?: () => void;
}

function getMaintenanceTypeBadge(type: MaintenanceRecord['type']) {
  const typeConfig: Record<MaintenanceRecord['type'], { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    REGULAR: { label: 'صيانة دورية', variant: 'default' },
    REPAIR: { label: 'إصلاح', variant: 'secondary' },
    EMERGENCY: { label: 'طارئ', variant: 'destructive' },
  };

  const config = typeConfig[type] || { label: type, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatCurrency(amount?: number) {
  if (!amount) return '--';
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MaintenanceHistory({ records, onAddRecord }: MaintenanceHistoryProps) {
  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          سجل الصيانة
        </CardTitle>
        {onAddRecord && (
          <Button size="sm" onClick={onAddRecord}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة سجل
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {sortedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا يوجد سجلات صيانة</p>
            {onAddRecord && (
              <Button variant="link" onClick={onAddRecord}>
                إضافة سجل جديد
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRecords.map((record, index) => (
              <div
                key={record._id || index}
                className="relative rounded-lg border p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getMaintenanceTypeBadge(record.type)}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(record.date)}
                    </div>
                  </div>
                  {record.documentId && (
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Description */}
                {record.description && (
                  <p className="text-sm">{record.description}</p>
                )}

                {/* Details */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {record.cost !== undefined && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>التكلفة: {formatCurrency(record.cost)}</span>
                    </div>
                  )}
                  {record.odometer !== undefined && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Gauge className="h-4 w-4" />
                      <span>العداد: {record.odometer.toLocaleString('ar-SA')} كم</span>
                    </div>
                  )}
                </div>

                {/* Timeline connector */}
                {index < sortedRecords.length - 1 && (
                  <div className="absolute -bottom-4 right-6 w-px h-4 bg-border" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MaintenanceHistory;
