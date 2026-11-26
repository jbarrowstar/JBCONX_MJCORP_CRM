import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { dismissToast, Toast } from '../../redux/slices/toastSlice';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-rose-50 border-rose-200 text-rose-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
} as const;

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), toast.type === 'error' ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [dispatch, toast.id, toast.type]);
  const Icon = ICONS[toast.type];
  return (
    <div role={toast.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 px-3.5 py-3 rounded-xl border shadow-lg text-xs font-semibold ${STYLES[toast.type]}`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-px" />
      <span className="flex-1">{toast.message}</span>
      <button type="button" aria-label="Dismiss" onClick={() => dispatch(dismissToast(toast.id))} className="opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastHost: React.FC = () => {
  const items = useAppSelector((s) => s.toast.items);
  return (
    <div className="fixed top-4 right-4 z-[60] w-80 space-y-2">
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
};
