'use client';

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-60 p-8 text-center">
          <div className="w-16 h-16 bg-[var(--destructive)]/10 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-[var(--destructive)]" />
          </div>
          <h3 className="font-black text-[var(--foreground)] text-lg mb-2">Terjadi Kesalahan</h3>
          <p className="text-[var(--muted-foreground)] font-bold text-sm mb-6 max-w-md">
            {this.state.error?.message || 'Something went wrong'}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-xl font-black text-xs uppercase tracking-widest"
          >
            <RefreshCcw size={16} className="mr-2" />
            Coba Lagi
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
