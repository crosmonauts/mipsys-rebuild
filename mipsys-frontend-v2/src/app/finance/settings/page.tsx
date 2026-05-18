'use client';
import React from 'react';
import { SettingsForm } from '@/src/features/finance/components/SettingsForm';

export default function SettingsPage() {
  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12 space-y-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
          Pengaturan <span className="text-blue-800">Finance</span>
        </h2>
        <SettingsForm />
      </div>
    </main>
  );
}
