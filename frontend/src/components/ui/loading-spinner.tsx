import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-9 w-9',
  lg: 'h-14 w-14',
};

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <span className="absolute inset-0 rounded-full border-2 border-primary/25" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-l-primary shadow-[0_0_20px_hsl(var(--primary)_/_0.35)]" />
    </div>
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl bg-muted/30 p-8">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
