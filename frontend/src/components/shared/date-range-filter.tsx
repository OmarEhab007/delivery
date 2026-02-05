'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DateRangeFilterProps {
  onRangeChange: (startDate?: string, endDate?: string) => void;
}

export function DateRangeFilter({ onRangeChange }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>('30days');

  const ranges = [
    { label: 'آخر 7 أيام', value: '7days', days: 7 },
    { label: 'آخر 30 يوم', value: '30days', days: 30 },
    { label: 'آخر 90 يوم', value: '90days', days: 90 },
    { label: 'آخر سنة', value: '365days', days: 365 },
    { label: 'كل الفترات', value: 'all', days: null },
  ];

  const handleRangeSelect = (value: string, days: number | null) => {
    setSelectedRange(value);

    if (days === null) {
      onRangeChange(undefined, undefined);
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    onRangeChange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  };

  const selectedLabel = ranges.find(r => r.value === selectedRange)?.label || 'اختر الفترة';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Calendar className="ml-2 h-4 w-4" />
          {selectedLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl border-border/70 bg-background/95">
        {ranges.map((range) => (
          <DropdownMenuItem
            key={range.value}
            onClick={() => handleRangeSelect(range.value, range.days)}
          >
            {range.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DateRangeFilter;
