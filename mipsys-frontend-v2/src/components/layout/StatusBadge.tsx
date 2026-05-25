'use client';

import { Badge } from '@/src/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  variant: 'ok' | 'low' | 'empty' | 'draft' | 'requested' | 'approved' | 'ordered' | 'shipped' | 'partially_received' | 'received' | 'cancelled' | 'awaiting_parts';
}

const variantMap: Record<StatusBadgeProps['variant'], 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'> = {
  ok: 'default',
  low: 'secondary',
  empty: 'destructive',
  draft: 'secondary',
  requested: 'secondary',
  approved: 'default',
  ordered: 'outline',
  shipped: 'default',
  partially_received: 'secondary',
  received: 'default',
  cancelled: 'destructive',
  awaiting_parts: 'outline',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  return <Badge variant={variantMap[variant]}>{status.replace('_', ' ')}</Badge>;
}
