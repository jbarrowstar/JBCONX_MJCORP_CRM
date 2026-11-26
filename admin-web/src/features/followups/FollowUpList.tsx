import React, { useState } from 'react';
import { CheckCircle2, CalendarClock, XCircle } from 'lucide-react';
import { FOLLOWUP_TYPE_LABELS, formatDateTime, type FollowUpDto } from '@shared/api/crm';
import { CancelFollowUpModal, CompleteFollowUpModal, FollowUpFormModal } from './FollowUpModals';

export const FollowUpStatusBadge: React.FC<{ f: FollowUpDto }> = ({ f }) => {
  const style =
    f.displayStatus === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200'
    : f.displayStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : f.displayStatus === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200'
    : 'bg-brand-50 text-brand-700 border-brand-200';
  return <span className={`badge capitalize ${style}`}>{f.displayStatus}</span>;
};

/** Action buttons for a single follow-up (complete / reschedule / cancel) with their dialogs. */
export const FollowUpActions: React.FC<{ followUp: FollowUpDto }> = ({ followUp }) => {
  const [mode, setMode] = useState<'complete' | 'edit' | 'cancel' | null>(null);
  if (followUp.status !== 'pending') return null;
  const btn = 'row-action';
  return (
    <>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setMode('complete')} className={`${btn} text-emerald-700 hover:bg-emerald-50`} aria-label={`Complete ${FOLLOWUP_TYPE_LABELS[followUp.type]} follow-up`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
        </button>
        <button type="button" onClick={() => setMode('edit')} className={`${btn} text-brand-700 hover:bg-brand-50`} aria-label="Reschedule follow-up">
          <CalendarClock className="w-3.5 h-3.5" /> Reschedule
        </button>
        <button type="button" onClick={() => setMode('cancel')} className={`${btn} text-rose-600 hover:bg-rose-50`} aria-label="Cancel follow-up">
          <XCircle className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
      {mode === 'complete' && <CompleteFollowUpModal followUp={followUp} onClose={() => setMode(null)} />}
      {mode === 'edit' && <FollowUpFormModal followUp={followUp} onClose={() => setMode(null)} />}
      {mode === 'cancel' && <CancelFollowUpModal followUp={followUp} onClose={() => setMode(null)} />}
    </>
  );
};

export const FollowUpList: React.FC<{ items: FollowUpDto[] }> = ({ items }) => {
  if (items.length === 0) return <p className="text-[13px] text-slate-500 py-6 text-center">No follow-ups for this lead.</p>;
  return (
    <ul className="space-y-3" data-testid="followup-list">
      {items.map((f) => (
        <li key={f.id} className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-slate-900">{FOLLOWUP_TYPE_LABELS[f.type]}</p>
            <FollowUpStatusBadge f={f} />
          </div>
          <p className={`text-xs mt-0.5 ${f.isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>Due {formatDateTime(f.dueAt)}</p>
          {f.notes && <p className="text-xs text-slate-600 mt-1">{f.notes}</p>}
          {f.outcomeNotes && <p className="text-xs text-emerald-700 mt-1">Outcome: {f.outcomeNotes}</p>}
          {f.cancelledReason && <p className="text-xs text-slate-500 mt-1">Cancelled: {f.cancelledReason}</p>}
          <div className="mt-3 -ml-2"><FollowUpActions followUp={f} /></div>
        </li>
      ))}
    </ul>
  );
};
