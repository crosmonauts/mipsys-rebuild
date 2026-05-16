type StatusConfig = {
  label: string;
  variant: 'default' | 'secondary' | 'outline';
  className: string;
};

const SYSTEM_CLOSED: StatusConfig = {
  label: 'Selesai',
  variant: 'secondary',
  className: 'bg-slate-100 text-slate-500 border-none',
};

const STATUS_MAP: Record<string, StatusConfig> = {
  'WAITING CHECK': {
    label: 'Baru (Antre)',
    variant: 'default',
    className: 'bg-slate-900 text-white hover:bg-slate-800',
  },
  'PENDING CHECK': {
    label: 'Baru (Antre)',
    variant: 'default',
    className: 'bg-slate-900 text-white hover:bg-slate-800',
  },
  SERVICE: {
    label: 'Dikerjakan',
    variant: 'default',
    className: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  'IN SERVICE': {
    label: 'Dikerjakan',
    variant: 'default',
    className: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  'WITH PART': {
    label: 'Menunggu Part',
    variant: 'outline',
    className: 'border-amber-500 text-amber-600 font-bold bg-amber-50',
  },
  'PENDING PART': {
    label: 'Menunggu Part',
    variant: 'outline',
    className: 'border-amber-500 text-amber-600 font-bold bg-amber-50',
  },
  DONE: {
    label: 'Siap Ambil',
    variant: 'default',
    className: 'bg-emerald-600 text-white animate-pulse hover:bg-emerald-700',
  },
  READY: {
    label: 'Siap Ambil',
    variant: 'default',
    className: 'bg-emerald-600 text-white animate-pulse hover:bg-emerald-700',
  },
};

const DEFAULT_STATUS: StatusConfig = {
  label: 'Unknown',
  variant: 'outline',
  className: 'text-slate-500',
};

export function getStatusConfig(
  statusService: string,
  statusSystem: string,
): StatusConfig {
  if (statusSystem === 'CLOSED') return SYSTEM_CLOSED;
  return STATUS_MAP[statusService] ?? DEFAULT_STATUS;
}

export function formatServiceDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getEmptyMessage(isLoading: boolean): string {
  if (isLoading) return 'Menghubungkan ke Database...';
  return 'Belum ada data permintaan servis yang terdaftar.';
}
