'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export type ExportFormat = 'csv' | 'pdf';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<void> | void;
  disabled?: boolean;
  label?: string;
}

export function ExportButton({ onExport, disabled, label = 'تصدير' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          {isExporting ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              جاري التصدير...
            </span>
          ) : (
            <>
              <Download className="ml-2 h-4 w-4" />
              {label}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl border-border/70 bg-background/95">
        <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportButton;
