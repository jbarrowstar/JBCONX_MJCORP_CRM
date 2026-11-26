import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { FOLLOWUP_TYPE_LABELS, formatDateTime, type FollowUpDto } from '@shared/api/crm';
import { CancelFollowUpSheet, CompleteFollowUpSheet } from './FollowUpSheets';

export const FollowUpCard: React.FC<{ f: FollowUpDto; showLead?: boolean; onOpenLead?: (id: string) => void }> = ({ f, showLead, onOpenLead }) => {
  const [mode, setMode] = useState<'complete' | 'cancel' | null>(null);
  const badge =
    f.displayStatus === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200'
    : f.displayStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : f.displayStatus === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200'
    : 'bg-brand-50 text-brand-700 border-brand-200';
  return (
    <li data-testid="followup-card" className={`card p-4 flex flex-col ${f.isOverdue ? 'border-l-4 !border-l-rose-500' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-slate-900">{FOLLOWUP_TYPE_LABELS[f.type]}</p>
        <span className={`badge capitalize ${badge}`}>{f.displayStatus}</span>
      </div>
      {showLead && f.lead && (
        <button type="button" onClick={() => onOpenLead?.(f.lead!.id)} className="text-[13px] link mt-0.5 text-left">
          {f.lead.customerName} <span className="cell-code">· {f.lead.leadCode}</span>
        </button>
      )}
      <p className={`text-xs mt-1.5 ${f.isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>Due {formatDateTime(f.dueAt)}</p>
      {f.notes && <p className="text-[13px] text-slate-600 mt-2">{f.notes}</p>}
      {f.outcomeNotes && <p className="text-xs text-emerald-700 mt-1">Outcome: {f.outcomeNotes}</p>}
      {f.status === 'pending' && (
        <div className="flex gap-2 mt-auto pt-4">
          <button type="button" onClick={() => setMode('complete')} aria-label={`Complete ${FOLLOWUP_TYPE_LABELS[f.type]} follow-up`} className="btn btn-sm flex-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </button>
          <button type="button" onClick={() => setMode('cancel')} aria-label="Cancel follow-up" className="btn btn-sm flex-1 text-rose-600 bg-rose-50 hover:bg-rose-100">
            <XCircle className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      )}
      {mode === 'complete' && <CompleteFollowUpSheet followUp={f} onClose={() => setMode(null)} />}
      {mode === 'cancel' && <CancelFollowUpSheet followUp={f} onClose={() => setMode(null)} />}
    </li>
  );
};
