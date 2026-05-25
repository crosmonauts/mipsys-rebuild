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
      {icon || <AlertCircle size={32} className="mx-auto mb-4 text-muted-foreground" />}
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {actionLabel && (
        <button 
          onClick={onAction}
          className="bg-primary text-primary-foreground hover:bg-primary/80 font-medium rounded-xl px-6 py-3 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}