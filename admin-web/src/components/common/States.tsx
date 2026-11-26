import React from 'react';
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500 text-[13px]" role="status">
    <span className="relative inline-flex w-8 h-8">
      <span className="absolute inset-0 rounded-full border-2 border-brand-100" />
      <span className="absolute inset-0 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
    </span>
    <span>{label}</span>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="card flex flex-col items-center text-center px-6 py-12" role="alert">
    <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
      <AlertTriangle className="w-5 h-5" />
    </div>
    <p className="text-sm font-semibold text-slate-900">Something went wrong</p>
    <p className="text-[13px] text-slate-500 mt-1 max-w-md">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm mt-4">
        <RotateCw className="w-3.5 h-3.5" /> Try again
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string; icon?: React.ElementType; compact?: boolean }> = ({ title, hint, icon: Icon = Inbox, compact }) => (
  <div className={`flex flex-col items-center text-center rounded-xl border border-dashed border-slate-300 bg-white/60 ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-sm font-semibold text-slate-800">{title}</p>
    {hint && <p className="text-[13px] text-slate-500 mt-1 max-w-sm">{hint}</p>}
  </div>
);

export const InlineError: React.FC<{ message?: string | null }> = ({ message }) =>
  message ? (
    <div role="alert" className="flex items-start gap-2 text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
      <AlertTriangle className="w-4 h-4 mt-px flex-shrink-0" />
      <span>{message}</span>
    </div>
  ) : null;
