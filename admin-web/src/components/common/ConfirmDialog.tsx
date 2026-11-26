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
      <p className="text-[13px] leading-relaxed text-slate-600">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className="btn btn-ghost">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);
