import { cn } from '@/src/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table-row' | 'avatar' | 'chart';
}

export function LoadingSkeleton({ className, variant = 'text' }: LoadingSkeletonProps) {
  const variants: Record<string, string> = {
    text: 'h-4 w-full rounded-md',
    card: 'h-40 w-full rounded-2xl',
    'table-row': 'h-12 w-full rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
    chart: 'h-48 w-full rounded-xl',
  };

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn('animate-pulse bg-muted', variants[variant], className)}
    />
  );
}

export function LoadingSkeletonCard() {
  return (
    <div className="paper-card p-6 space-y-4" aria-hidden="true" role="presentation">
      <LoadingSkeleton variant="avatar" className="w-12 h-12" />
      <LoadingSkeleton variant="text" className="w-1/2" />
      <LoadingSkeleton variant="text" className="w-3/4" />
      <LoadingSkeleton variant="text" className="w-1/3" />
    </div>
  );
}

export function LoadingSkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true" role="presentation">
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} variant="table-row" />
      ))}
    </div>
  );
}
