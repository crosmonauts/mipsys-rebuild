'use client';

import { ClipboardList, Clock, Wrench, Package, CheckCircle2, XCircle } from 'lucide-react';

interface SrStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    inService: number;
    awaitingParts: number;
    ready: number;
    closed: number;
    cancelled: number;
  };
}

const cards = [
  { key: 'total', label: 'Total', icon: ClipboardList, color: 'text-primary' },
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-400' },
  { key: 'inService', label: 'In Service', icon: Wrench, color: 'text-blue-400' },
  { key: 'awaitingParts', label: 'Menunggu Part', icon: Package, color: 'text-orange-400' },
  { key: 'ready', label: 'Ready', icon: CheckCircle2, color: 'text-emerald-400' },
  { key: 'closed', label: 'Closed', icon: XCircle, color: 'text-muted-foreground' },
] as const;

export function SrStatsCards({ stats }: SrStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="paper-card p-5 flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-background/50 ${color}`}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold font-display tracking-tight text-foreground">
              {stats[key as keyof typeof stats]}
            </p>
            <p className="micro-label text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
