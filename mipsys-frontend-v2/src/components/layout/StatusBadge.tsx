'use client';

interface StatusBadgeProps {
  status: string;
  variant: 'ok' | 'low' | 'empty' | 'draft' | 'requested' | 'approved' | 'ordered' | 'shipped' | 'partially_received' | 'received' | 'cancelled';
}

const variantStyles: Record<StatusBadgeProps['variant'], string> = {
  ok: 'bg-green-100 text-green-800',
  low: 'bg-amber-100 text-amber-800',
  empty: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-700',
  requested: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  ordered: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  partially_received: 'bg-orange-100 text-orange-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const className = `inline-block px-3 py-1 rounded-full text-xs font-bold ${variantStyles[variant] || 'bg-gray-100 text-gray-700'}`;
  return <span className={className}>{status.replace('_', ' ')}</span>;
}
