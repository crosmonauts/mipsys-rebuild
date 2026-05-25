import React from 'react';
import {
  ClipboardList,
  Search,
  Wrench,
  Package,
  CheckCircle2,
} from 'lucide-react';

type ServiceStep = {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  date?: string;
};

interface RepairTimelineProps {
  statusService: string;
  incomingDate?: string;
  checkDate?: string;
  spDate?: string;
  approveDate?: string;
  readyDate?: string;
  closeDate?: string;
}

export function RepairTimeline({
  statusService,
  incomingDate,
  checkDate,
  spDate,
  approveDate,
  readyDate,
  closeDate,
}: RepairTimelineProps) {
  const steps = buildSteps(statusService, {
    incomingDate,
    checkDate,
    spDate,
    approveDate,
    readyDate,
    closeDate,
  });

  return (
    <div className="space-y-4">
      <h3 className="micro-label text-primary flex items-center gap-6">
        Repair Progress{' '}
        <span className="h-[1px] flex-1 bg-border/20"></span>
      </h3>

      <div className="space-y-0">
        {steps.map((step, index) => (
          <TimelineStep
            key={step.key}
            step={step}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineStep({
  step,
  isLast,
}: {
  step: ServiceStep;
  isLast: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusRing(step.status)}`}
        >
          {step.icon}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 h-12 ${getLineColor(step.status)}`}
          />
        )}
      </div>

      <div className="pt-2 flex-1">
        <p
          className={`text-sm font-black ${getTextColor(step.status)}`}
        >
          {step.label}
        </p>
        {step.date && (
          <p className="micro-label text-muted-foreground mt-0.5">
            {step.date}
          </p>
        )}
      </div>
    </div>
  );
}

function buildSteps(
  statusService: string,
  dates: Record<string, string | undefined>,
): ServiceStep[] {
  const currentStep = mapStatusToStep(statusService);

  return [
    {
      key: 'received',
      label: 'Unit Diterima',
      icon: <ClipboardList size={16} aria-hidden="true" />,
      status: getStepStatus('received', currentStep),
      date: dates.incomingDate,
    },
    {
      key: 'checked',
      label: 'Pengecekan',
      icon: <Search size={16} aria-hidden="true" />,
      status: getStepStatus('checked', currentStep),
      date: dates.checkDate,
    },
    {
      key: 'diagnosed',
      label: 'Diagnosa',
      icon: <Wrench size={16} aria-hidden="true" />,
      status: getStepStatus('diagnosed', currentStep),
      date: dates.spDate,
    },
    {
      key: 'parts',
      label: 'Penggantian Part',
      icon: <Package size={16} aria-hidden="true" />,
      status: getStepStatus('parts', currentStep),
      date: dates.approveDate,
    },
    {
      key: 'done',
      label: 'Selesai',
      icon: <CheckCircle2 size={16} aria-hidden="true" />,
      status: getStepStatus('done', currentStep),
      date: dates.readyDate || dates.closeDate,
    },
  ];
}

function mapStatusToStep(status: string): number {
  const statusMap: Record<string, number> = {
    WAITING_CHECK: 0,
    CHECK: 1,
    WAITING_APPROVE: 2,
    AWAITING_PARTS: 2,
    SERVICE: 3,
    DONE: 4,
    CANCEL: 4,
  };

  return statusMap[status] ?? 0;
}

function getStepStatus(
  stepKey: string,
  currentStep: number,
): 'completed' | 'current' | 'pending' {
  const stepOrder = ['received', 'checked', 'diagnosed', 'parts', 'done'];
  const stepIndex = stepOrder.indexOf(stepKey);

  if (stepIndex < currentStep) return 'completed';
  if (stepIndex === currentStep) return 'current';
  return 'pending';
}

function getStatusRing(status: ServiceStep['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-accent/20 text-accent';
    case 'current':
      return 'bg-primary/20 text-primary ring-2 ring-primary/40';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getLineColor(status: ServiceStep['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-accent/30';
    case 'current':
      return 'bg-primary/30';
    default:
      return 'bg-border/30';
  }
}

function getTextColor(status: ServiceStep['status']): string {
  switch (status) {
    case 'completed':
      return 'text-accent';
    case 'current':
      return 'text-primary';
    default:
      return 'text-muted-foreground';
  }
}
