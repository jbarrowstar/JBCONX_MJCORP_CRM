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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={() => !busy && onClose()} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative bg-white w-full max-w-lg rounded-t-3xl shadow-2xl flex flex-col ${tall ? 'h-[92vh]' : 'max-h-[88vh]'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="text-slate-400 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const fieldClass = 'w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]';
export const labelClass = 'block text-xs font-bold text-slate-700 mb-1';
