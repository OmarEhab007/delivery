/**
 * Reusable Advanced Filters Component
 * Provides a configurable filter bar for list pages
 */

'use client';

import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

interface AdvancedFiltersProps {
  config: FilterConfig[];
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
  onReset: () => void;
  activeCount?: number;
}

export function AdvancedFilters({
  config,
  values,
  onChange,
  onReset,
  activeCount = 0,
}: AdvancedFiltersProps) {
  const renderFilterInput = (filter: FilterConfig) => {
    const value = values[filter.key] || '';

    switch (filter.type) {
      case 'select':
        return (
          <Select
            key={filter.key}
            value={value}
            onValueChange={(val) => onChange(filter.key, val === 'all' ? undefined : val)}
          >
            <SelectTrigger className="h-9 w-full min-w-[140px] sm:w-auto">
              <SelectValue placeholder={filter.placeholder || filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <div key={filter.key} className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{filter.label}</label>
            <Input
              type="date"
              value={value}
              onChange={(e) => onChange(filter.key, e.target.value || undefined)}
              className="h-9 w-full sm:w-auto"
            />
          </div>
        );

      case 'text':
        return (
          <Input
            key={filter.key}
            type="text"
            placeholder={filter.placeholder || filter.label}
            value={value}
            onChange={(e) => onChange(filter.key, e.target.value || undefined)}
            className="h-9 w-full sm:w-auto"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-border/60 bg-card/50 p-3">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">تصفية النتائج</span>
            {activeCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeCount}
              </Badge>
            )}
          </div>

          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 gap-1 px-2 text-xs"
            >
              <X className="h-3 w-3" />
              مسح الكل
            </Button>
          )}
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-wrap items-end gap-2">
          {config.map((filter) => renderFilterInput(filter))}
        </div>
      </div>
    </Card>
  );
}
