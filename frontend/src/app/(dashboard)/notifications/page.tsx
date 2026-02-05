'use client';

import { Bell, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const notifications = [
  {
    id: 'n-1',
    title: 'تم تحديث حالة الشحنة',
    description: 'الشحنة #ALM-2048 أصبحت في الطريق إلى الوجهة.',
    time: 'قبل 10 دقائق',
    type: 'info',
  },
  {
    id: 'n-2',
    title: 'تم قبول عرضك',
    description: 'تم قبول العرض المقدم للشحنة #ALM-1993.',
    time: 'قبل ساعة',
    type: 'success',
  },
  {
    id: 'n-3',
    title: 'تنبيه مستندات',
    description: 'تنتهي صلاحية التأمين خلال 7 أيام.',
    time: 'قبل يوم',
    type: 'warning',
  },
];

const typeStyles: Record<string, { icon: typeof Bell; badge: string } > = {
  info: { icon: Bell, badge: 'معلومات' },
  success: { icon: CheckCircle2, badge: 'نجاح' },
  warning: { icon: AlertTriangle, badge: 'تنبيه' },
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">الإشعارات</h1>
        <p className="text-sm text-muted-foreground">آخر التنبيهات والتحديثات المرتبطة بحسابك.</p>
      </div>

      <div className="space-y-4">
        {notifications.map((item) => {
          const style = typeStyles[item.type] || typeStyles.info;
          const Icon = style.icon;

          return (
            <Card key={item.id} className="border-border/60 bg-surface/90">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Badge variant="secondary">{style.badge}</Badge>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                {item.time}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
