import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/** Mobile bottom sheet (full width, slides up). Closes on Escape and backdrop tap. */
export const Sheet: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; busy?: boolean; tall?: boolean }> = ({ title, onClose, children, busy, tall }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/40 animate-fade-in" onClick={() => !busy && onClose()} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-xl shadow-overlay border border-slate-200 flex flex-col animate-slide-up ${tall ? 'h-[92vh] sm:h-auto sm:max-h-[88vh]' : 'max-h-[88vh]'}`}>
        <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" aria-hidden />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="icon-btn -mr-2 w-8 h-8"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto scroll-thin flex-1">{children}</div>
      </div>
    </div>
  );
};

export const fieldClass = 'control w-full h-11 text-sm';
export const labelClass = 'label';
