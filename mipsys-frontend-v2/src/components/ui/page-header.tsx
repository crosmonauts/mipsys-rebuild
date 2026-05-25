import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    icon: ReactNode;
    label: string;
  };
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, badge, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div className="space-y-1.5">
        {badge && (
          <div className="flex items-center gap-2 w-fit px-2.5 py-0.5 bg-primary/20 text-primary rounded text-[9px] font-black uppercase tracking-widest border border-primary/30">
            {badge.icon} {badge.label}
          </div>
        )}
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight uppercase">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground font-bold italic">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex gap-2 shrink-0">{children}</div>}
    </div>
  );
}
