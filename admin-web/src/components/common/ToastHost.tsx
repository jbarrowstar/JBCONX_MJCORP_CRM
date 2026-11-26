import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { dismissToast, Toast } from '../../redux/slices/toastSlice';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const STYLES = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-brand-600',
} as const;

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), toast.type === 'error' ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [dispatch, toast.id, toast.type]);
  const Icon = ICONS[toast.type];
  return (
    <div role={toast.type === 'error' ? 'alert' : 'status'} className="flex items-start gap-2.5 pl-3.5 pr-2.5 py-3 rounded-lg border border-slate-200 bg-white shadow-raised text-[13px] font-medium text-slate-800 animate-slide-up">
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${STYLES[toast.type]}`} />
      <span className="flex-1 leading-5">{toast.message}</span>
      <button type="button" aria-label="Dismiss" onClick={() => dispatch(dismissToast(toast.id))} className="p-0.5 rounded text-slate-400 hover:text-slate-700">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastHost: React.FC = () => {
  const items = useAppSelector((s) => s.toast.items);
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[60] sm:w-96 space-y-2">
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
};
