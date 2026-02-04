'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4',
        variant === 'destructive' && 'border-destructive/50 text-destructive',
        className
      )}
      {...props}
    />
  );
}

export type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <h5
      className={cn(
        'mb-1 font-medium leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

export type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <p
      className={cn(
        'text-sm text-muted-foreground [&_p]:leading-relaxed',
        className
      )}
      {...props}
    />
  );
}
