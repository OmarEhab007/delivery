'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SettingsTab {
  value: string;
  label: string;
  description?: string;
  content: ReactNode;
}

interface SettingsLayoutProps {
  title: string;
  description?: string;
  tabs: SettingsTab[];
  className?: string;
}

export function SettingsLayout({ title, description, tabs, className }: SettingsLayoutProps) {
  const defaultTab = tabs[0]?.value;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            {tab.description && (
              <Card className="border-dashed bg-muted/40">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  {tab.description}
                </CardContent>
              </Card>
            )}
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default SettingsLayout;
