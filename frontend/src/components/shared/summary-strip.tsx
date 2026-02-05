'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SummaryItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  tone?: 'warm' | 'sand' | 'cream';
}

const toneStyles: Record<NonNullable<SummaryItem['tone']>, string> = {
  warm: 'bg-[linear-gradient(135deg,_hsl(var(--primary)_/_0.12),_hsl(var(--muted)_/_0.55))]',
  sand: 'bg-[linear-gradient(135deg,_hsl(var(--primary)_/_0.08),_hsl(var(--background)_/_0.8))]',
  cream: 'bg-[linear-gradient(135deg,_hsl(var(--primary)_/_0.06),_hsl(var(--surface)_/_0.85))]',
};

export function SummaryStrip({ items, className }: { items: SummaryItem[]; className?: string }) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-3', className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const tone = item.tone || (index % 3 === 0 ? 'warm' : index % 3 === 1 ? 'sand' : 'cream');
        return (
          <Card key={`${item.label}-${index}`} className={cn('border-border/60 shadow-sm', toneStyles[tone])}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {Icon && <Icon className="h-4 w-4 text-primary" />}
                <span>{item.label}</span>
              </div>
              <div className="mt-2 text-sm font-medium text-foreground">{item.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default SummaryStrip;
