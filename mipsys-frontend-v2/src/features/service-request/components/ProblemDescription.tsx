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
    <h2 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.5em] flex items-center gap-6">
      02. Issue Description{' '}
      <span className="h-[1px] flex-1 bg-stone-100"></span>
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
        className="w-full p-6 bg-white border border-stone-100 rounded-3xl outline-none focus:border-amber-600 transition-all font-medium text-stone-800 min-h-[150px] shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DisplayProblem({ value }: { value: string }) {
  return (
    <div className="group">
      <div className="p-10 bg-white border border-stone-50 rounded-[3rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600/20"></div>
        <p className="text-xl font-medium leading-relaxed text-stone-800 italic font-serif">
          &quot;{value || 'No detailed problem reported.'}&quot;
        </p>
      </div>
    </div>
  );
}
