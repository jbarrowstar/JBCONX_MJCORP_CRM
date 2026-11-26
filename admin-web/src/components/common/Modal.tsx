import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  busy?: boolean;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' } as const;

export const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = 'md', busy }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-2xl w-full ${SIZES[size]} shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col`}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
