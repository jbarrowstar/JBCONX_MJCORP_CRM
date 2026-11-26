import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { dismissToast, Toast } from '../../redux/slices/toastSlice';

const STYLES = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white',
  info: 'bg-slate-800 text-white',
} as const;

const Item: React.FC<{ toast: Toast }> = ({ toast }) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), toast.type === 'error' ? 7000 : 3500);
    return () => clearTimeout(t);
  }, [dispatch, toast.id, toast.type]);
  return (
    <div role={toast.type === 'error' ? 'alert' : 'status'} onClick={() => dispatch(dismissToast(toast.id))} className={`px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold ${STYLES[toast.type]}`}>
      {toast.message}
    </div>
  );
};

export const ToastHost: React.FC = () => {
  const items = useAppSelector((s) => s.toast.items);
  return (
    <div className="fixed bottom-24 lg:bottom-6 inset-x-4 z-[70] space-y-2 pointer-events-none [&>*]:pointer-events-auto max-w-md mx-auto">
      {items.map((t) => <Item key={t.id} toast={t} />)}
    </div>
  );
};
