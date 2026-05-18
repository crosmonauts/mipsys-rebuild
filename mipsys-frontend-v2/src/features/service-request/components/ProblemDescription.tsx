import React from 'react';

interface ProblemDescriptionProps {
  value: string;
  isEditing: boolean;
  onChange: (v: string) => void;
}

export function ProblemDescription({
  value,
  isEditing,
  onChange,
}: ProblemDescriptionProps) {
  return (
    <section className="space-y-10">
      <SectionHeader />

      {isEditing ? (
        <EditProblem value={value} onChange={onChange} />
      ) : (
        <DisplayProblem value={value} />
      )}
    </section>
  );
}

function SectionHeader() {
  return (
    <h2 className="micro-label text-primary flex items-center gap-6">
      02. Issue Description{' '}
      <span className="h-[1px] flex-1 bg-border/20"></span>
    </h2>
  );
}

function EditProblem({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="group">
      <textarea
        className="w-full p-6 bg-card border border-border/20 rounded-3xl outline-none focus:border-primary transition-all font-medium text-foreground/80 min-h-[150px] shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DisplayProblem({ value }: { value: string }) {
  return (
    <div className="group">
      <div className="glass-panel p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20"></div>
        <p className="text-xl font-medium leading-relaxed text-foreground/80 italic">
          &quot;{value || 'No detailed problem reported.'}&quot;
        </p>
      </div>
    </div>
  );
}
