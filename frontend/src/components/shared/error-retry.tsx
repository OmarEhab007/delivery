'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorRetryProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorRetry({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorRetryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/20">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold">Error</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
