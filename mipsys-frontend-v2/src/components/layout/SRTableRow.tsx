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
    <TableRow className="hover:bg-blue-50/30 transition-colors group border-slate-50">
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
    <TableCell className="font-black text-slate-900 pl-8">
      {ticketNumber}
    </TableCell>
  );
}

function CustomerCell({ name }: { name: string }) {
  return (
    <TableCell className="font-bold text-slate-700">{name}</TableCell>
  );
}

function ModelCell({ modelName }: { modelName: string }) {
  return (
    <TableCell className="text-slate-500 font-medium">{modelName}</TableCell>
  );
}

function SerialCell({ serialNumber }: { serialNumber: string }) {
  return (
    <TableCell>
      <code className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 font-bold shadow-sm">
        {serialNumber || '-'}
      </code>
    </TableCell>
  );
}

function TypeCell({ serviceType }: { serviceType: string }) {
  return (
    <TableCell className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
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
    <TableCell className="text-slate-500 text-xs font-bold">
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
          className="rounded-xl font-bold text-xs hover:bg-slate-900 hover:text-white transition-all gap-2"
        >
          Detail <ExternalLink size={14} />
        </Button>
      </Link>
    </TableCell>
  );
}
