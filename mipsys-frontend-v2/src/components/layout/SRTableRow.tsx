import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
  TableRow,
  TableCell,
} from '@/src/components/ui/table';
import { ServiceRequest } from '@/src/features/service-request/types';
import { getStatusConfig, formatServiceDate } from './status-config';

interface SRTableRowProps {
  sr: ServiceRequest;
}

export function SRTableRow({ sr }: SRTableRowProps) {
  const config = getStatusConfig(sr.statusService, sr.statusSystem ?? '');

  return (
    <TableRow className="hover:bg-[var(--muted)]/30 transition-colors group border-border/30">
      <TicketCell ticketNumber={sr.ticketNumber} />
      <CustomerCell name={sr.customerName} />
      <ModelCell modelName={sr.modelName} />
      <SerialCell serialNumber={sr.serialNumber} />
      <TypeCell serviceType={sr.serviceType} />
      <StatusCell config={config} />
      <DateCell incomingDate={sr.incomingDate} />
      <ActionCell ticketNumber={sr.ticketNumber} />
    </TableRow>
  );
}

function TicketCell({ ticketNumber }: { ticketNumber: string }) {
  return (
    <TableCell className="font-black text-[var(--foreground)] pl-8">
      {ticketNumber}
    </TableCell>
  );
}

function CustomerCell({ name }: { name: string }) {
  return (
    <TableCell className="font-bold text-[var(--foreground)]/80">{name}</TableCell>
  );
}

function ModelCell({ modelName }: { modelName: string }) {
  return (
    <TableCell className="text-[var(--muted-foreground)] font-medium">{modelName}</TableCell>
  );
}

function SerialCell({ serialNumber }: { serialNumber: string }) {
  return (
    <TableCell>
      <code className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-1 rounded-md border border-primary/30 font-bold shadow-sm">
        {serialNumber || '-'}
      </code>
    </TableCell>
  );
}

function TypeCell({ serviceType }: { serviceType: string }) {
  return (
    <TableCell className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-tighter">
      {serviceType}
    </TableCell>
  );
}

function StatusCell({ config }: { config: ReturnType<typeof getStatusConfig> }) {
  return (
    <TableCell className="text-center">
      <Badge
        className={`${config.className} rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-none`}
      >
        {config.label}
      </Badge>
    </TableCell>
  );
}

function DateCell({ incomingDate }: { incomingDate: string | undefined }) {
  return (
    <TableCell className="text-[var(--muted-foreground)] text-xs font-bold">
      {incomingDate ? formatServiceDate(incomingDate) : '-'}
    </TableCell>
  );
}

function ActionCell({ ticketNumber }: { ticketNumber: string }) {
  return (
    <TableCell className="text-right pr-8">
      <Link href={`/service-request/${ticketNumber}`}>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl font-bold text-xs hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-all gap-2"
        >
          Detail <ExternalLink size={14} aria-hidden="true" />
        </Button>
      </Link>
    </TableCell>
  );
}
