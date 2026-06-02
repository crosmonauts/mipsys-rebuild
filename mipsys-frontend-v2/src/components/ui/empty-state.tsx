'use client';

import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon || <AlertCircle size={32} className="mx-auto mb-4 text-[var(--muted-foreground)]" />}
      <h3 className="font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-[var(--muted-foreground)] mb-6">{description}</p>
      {actionLabel && (
        <button 
          onClick={onAction}
          className="bg-[var(--primary)] text-[var(--primary)]-foreground hover:bg-[var(--primary)]/80 font-medium rounded-xl px-6 py-3 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}