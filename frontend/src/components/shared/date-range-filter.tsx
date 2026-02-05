'use client';

import { useState, useEffect, useRef } from 'react';
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
  const initialEmitted = useRef(false);

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

    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    onRangeChange(formatLocalDate(startDate), formatLocalDate(endDate));
  };

  // Emit initial range on mount (default: 30 days)
  useEffect(() => {
    if (initialEmitted.current) return;
    initialEmitted.current = true;
    const defaultRange = ranges.find(r => r.value === '30days');
    if (defaultRange?.days) {
      handleRangeSelect('30days', defaultRange.days);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
