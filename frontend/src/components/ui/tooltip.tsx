'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type TooltipProviderProps = {
  children: React.ReactNode;
};

type TooltipProps = {
  children: React.ReactNode;
  className?: string;
};

type TooltipTriggerProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
};

type TooltipContentProps = React.HTMLAttributes<HTMLSpanElement> & {
  sideOffset?: number;
};

const TooltipProvider = ({ children }: TooltipProviderProps) => <>{children}</>;

const Tooltip = ({ children, className }: TooltipProps) => (
  <span className={cn('relative inline-flex group', className)}>{children}</span>
);

const TooltipTrigger = React.forwardRef<HTMLSpanElement, TooltipTriggerProps>(
  ({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'span';
    return (
      <Comp ref={ref} className={cn('inline-flex', className)} {...props} />
    );
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<HTMLSpanElement, TooltipContentProps>(
  ({ className, sideOffset = 8, style, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'pointer-events-none absolute left-1/2 top-0 z-50 w-max -translate-x-1/2 -translate-y-full',
        'rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md opacity-0 transition',
        'group-hover:opacity-100',
        className
      )}
      style={{ marginTop: -sideOffset, ...style }}
      {...props}
    />
  )
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
