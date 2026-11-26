import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { FOLLOWUP_TYPE_LABELS, formatDateTime, type FollowUpDto } from '@shared/api/crm';
import { CancelFollowUpSheet, CompleteFollowUpSheet } from './FollowUpSheets';

export const FollowUpCard: React.FC<{ f: FollowUpDto; showLead?: boolean; onOpenLead?: (id: string) => void }> = ({ f, showLead, onOpenLead }) => {
  const [mode, setMode] = useState<'complete' | 'cancel' | null>(null);
  const badge =
    f.displayStatus === 'overdue' ? 'bg-red-50 text-red-700 border-red-200'
    : f.displayStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : f.displayStatus === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';
  return (
    <li data-testid="followup-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{FOLLOWUP_TYPE_LABELS[f.type]}</p>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${badge}`}>{f.displayStatus}</span>
      </div>
      {showLead && f.lead && (
        <button type="button" onClick={() => onOpenLead?.(f.lead!.id)} className="text-xs font-semibold text-[#274C77] mt-0.5 text-left">
          {f.lead.customerName} <span className="font-mono text-slate-400">· {f.lead.leadCode}</span>
        </button>
      )}
      <p className={`text-xs mt-1 ${f.isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>Due {formatDateTime(f.dueAt)}</p>
      {f.notes && <p className="text-xs text-slate-600 mt-1">{f.notes}</p>}
      {f.outcomeNotes && <p className="text-xs text-emerald-700 mt-1">Outcome: {f.outcomeNotes}</p>}
      {f.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => setMode('complete')} aria-label={`Complete ${FOLLOWUP_TYPE_LABELS[f.type]} follow-up`} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </button>
          <button type="button" onClick={() => setMode('cancel')} aria-label="Cancel follow-up" className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl">
            <XCircle className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      )}
      {mode === 'complete' && <CompleteFollowUpSheet followUp={f} onClose={() => setMode(null)} />}
      {mode === 'cancel' && <CancelFollowUpSheet followUp={f} onClose={() => setMode(null)} />}
    </li>
  );
};
