import React from 'react';
import { Modal } from './Modal';

interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<Props> = ({ title, message, confirmLabel, danger, busy, onConfirm, onCancel }) => (
  <Modal title={title} onClose={onCancel} size="sm" busy={busy}>
    <div className="p-5 space-y-5">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm disabled:opacity-60 ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#274C77] hover:bg-[#1B3B6F]'}`}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);
