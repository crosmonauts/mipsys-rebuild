'use client';
import React from 'react';
import { SettingsForm } from '../components/SettingsForm';
import { PageHeader } from '@/src/components/ui/page-header';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Pengaturan Finance"
      />
      <SettingsForm />
    </div>
  );
}
