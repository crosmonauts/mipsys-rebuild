import React from 'react';
import { History, RefreshCcw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Activity {
  time?: string;
  status?: string;
  user?: string;
  task?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  loading: boolean;
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  return (
    <div className="lg:col-span-2 bg-white border-2 border-slate-100 rounded-2xl p-7 shadow-sm">
      <FeedHeader />

      <div className="space-y-5">
        {loading ? (
          <LoadingIndicator />
        ) : (
          activities.map((log, i) => <ActivityItem key={i} log={log} />)
        )}
      </div>
    </div>
  );
}

function FeedHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <History size={20} className="text-slate-800" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-950">
          Aktivitas Terkini
        </h3>
      </div>
      <button className="text-[10px] font-black text-blue-800 hover:text-blue-600 underline uppercase tracking-widest">
        Log Lengkap
      </button>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="py-10 flex flex-col items-center gap-3 text-slate-800">
      <RefreshCcw className="w-6 h-6 animate-spin text-slate-300" />
    </div>
  );
}

function ActivityItem({ log }: { log: Activity }) {
  return (
    <div className="flex items-center gap-5 group animate-in slide-in-from-left-4 duration-500">
      <TimeDisplay time={log.time} />
      <StatusIcon status={log.status} />
      <ActivityText user={log.user} task={log.task} />
    </div>
  );
}

function TimeDisplay({ time }: { time?: string }) {
  return (
    <span className="text-slate-900 font-mono w-12 text-[10px] font-black border-r border-slate-100">
      {time}
    </span>
  );
}

function StatusIcon({ status }: { status?: string }) {
  const icon = getIconForStatus(status);
  return (
    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors border border-transparent">
      {icon}
    </div>
  );
}

function getIconForStatus(status?: string) {
  switch (status?.toUpperCase()) {
    case 'DONE':
      return <CheckCircle2 size={14} className="text-emerald-700" />;
    case 'SERVICE':
      return <Clock size={14} className="text-blue-700" />;
    default:
      return <AlertCircle size={14} className="text-amber-700" />;
  }
}

function ActivityText({ user, task }: { user?: string; task?: string }) {
  return (
    <div className="flex-1 min-w-0">
      <span className="font-black text-slate-950 mr-2 uppercase tracking-tight text-[11px]">
        {user}
      </span>
      <span className="text-slate-600 italic truncate block md:inline font-bold text-[11px]">
        "{task}"
      </span>
    </div>
  );
}
