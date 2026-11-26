import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate-500 text-xs font-medium" role="status">
    <span className="inline-block w-5 h-5 border-2 border-[#274C77] border-t-transparent rounded-full animate-spin" />
    <span>{label}</span>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center" role="alert">
    <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
    <p className="text-sm font-semibold text-rose-800">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-100"
      >
        Try again
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
    <Inbox className="w-7 h-7 text-slate-300 mx-auto mb-2" />
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const InlineError: React.FC<{ message?: string | null }> = ({ message }) =>
  message ? (
    <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
      {message}
    </div>
  ) : null;
