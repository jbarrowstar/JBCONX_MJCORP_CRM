import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  busy?: boolean;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = 'md', busy }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/40 animate-fade-in" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative bg-white w-full ${SIZES[size]} rounded-t-2xl sm:rounded-xl shadow-overlay border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up`}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-slate-900 truncate">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="icon-btn -mr-2 w-8 h-8">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto scroll-thin">{children}</div>
      </div>
    </div>
  );
};
