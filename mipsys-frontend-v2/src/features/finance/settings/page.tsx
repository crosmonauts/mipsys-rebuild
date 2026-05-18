'use client';
import React from 'react';
import { SettingsForm } from '../components/SettingsForm';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
        Pengaturan <span className="text-blue-800">Finance</span>
      </h2>
      <SettingsForm />
    </div>
  );
}
