import React, { useState } from 'react';
import { Phone, Mail, MapPin, Pencil, CalendarPlus, Send } from 'lucide-react';
import { ActivityTimeline } from '@shared/components/ActivityTimeline';
import { LeadStatusBadge, PriorityBadge } from '@shared/components/LeadBadges';
import {
  AGENT_SETTABLE_STATUSES, CLOSED_STATUSES, LEAD_STATUS_LABELS, formatDateTime, type LeadDto, type LeadStatusValue,
} from '@shared/api/crm';
import { errorMessage, normalizeError } from '@shared/api/errors';
import { Sheet, fieldClass, labelClass } from '../../components/common/Sheet';
import { useAppDispatch } from '../../redux/hooks';
import {
  useAddLeadNoteMutation, useChangeLeadStatusMutation, useGetLeadQuery, useListFollowUpsQuery, useListLeadActivitiesQuery,
} from '../../redux/services/crmApi';
import { pushToast } from '../../redux/slices/toastSlice';
import { FollowUpCard } from './FollowUpCards';
import { ScheduleFollowUpSheet } from './FollowUpSheets';
import { LeadFormSheet } from './LeadFormSheet';

const StatusSheet: React.FC<{ lead: LeadDto; onClose: () => void }> = ({ lead, onClose }) => {
  const dispatch = useAppDispatch();
  const [change, { isLoading }] = useChangeLeadStatusMutation();
  const options = AGENT_SETTABLE_STATUSES.filter((s) => s !== lead.status);
  const [status, setStatus] = useState<LeadStatusValue>(options[0]);
  const [lostReason, setLostReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'lost' && lostReason.trim().length < 3) return setError('Give a reason for losing this lead (at least 3 characters).');
    try {
      await change({ id: lead.id, status, ...(remarks.trim() && { remarks: remarks.trim() }), ...(status === 'lost' && { lostReason: lostReason.trim() }) }).unwrap();
      dispatch(pushToast('success', `Status changed to ${LEAD_STATUS_LABELS[status]}.`));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };
  return (
    <Sheet title="Update status" onClose={onClose} busy={isLoading}>
      <form onSubmit={submit} className="p-5 space-y-4">
        {error && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label htmlFor="m-st" className={labelClass}>New status</label>
          <select id="m-st" value={status} onChange={(e) => setStatus(e.target.value as LeadStatusValue)} className={fieldClass}>
            {options.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        {status === 'lost' && (
          <div>
            <label htmlFor="m-st-lost" className={labelClass}>Reason lost *</label>
            <textarea id="m-st-lost" rows={2} value={lostReason} onChange={(e) => setLostReason(e.target.value)} className={fieldClass} />
          </div>
        )}
        {(status === 'converted' || status === 'lost') && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Closing a lead cancels its pending follow-ups. Only your team leader can reopen it.</p>}
        <div>
          <label htmlFor="m-st-remarks" className={labelClass}>Remarks</label>
          <textarea id="m-st-remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={fieldClass} />
        </div>
        <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">{isLoading ? 'Saving…' : 'Update status'}</button>
      </form>
    </Sheet>
  );
};

export const LeadSheet: React.FC<{ leadId: string; onClose: () => void }> = ({ leadId, onClose }) => {
  const dispatch = useAppDispatch();
  const lead = useGetLeadQuery(leadId);
  const activities = useListLeadActivitiesQuery({ id: leadId, page: 1, limit: 30 });
  const followUps = useListFollowUpsQuery({ leadId, limit: 50, order: 'asc' });
  const [addNote, noteState] = useAddLeadNoteMutation();
  const [sub, setSub] = useState<'status' | 'edit' | 'followup' | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  const l = lead.data;
  const closed = l ? CLOSED_STATUSES.includes(l.status) : false;

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await addNote({ id: leadId, message: note.trim() }).unwrap();
      setNote('');
      dispatch(pushToast('success', 'Note added.'));
    } catch (err) {
      setNoteError(normalizeError(err).message);
    }
  };
  const action = 'btn btn-secondary flex-1';

  return (
    <Sheet title={l ? `${l.leadCode} · ${l.customerName}` : 'Lead'} onClose={onClose} tall>
      {lead.isLoading ? (
        <p className="p-8 text-center text-xs text-slate-500" role="status">Loading lead…</p>
      ) : lead.isError || !l ? (
        <div className="p-5"><div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-3">{errorMessage(lead.error)}</div></div>
      ) : (
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2"><LeadStatusBadge status={l.status} /><PriorityBadge priority={l.priority} /></div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 space-y-2 text-[13px] text-slate-700">
            <a href={`tel:${l.mobileNumber}`} className="flex items-center gap-2 link text-sm"><Phone className="w-4 h-4" />{l.mobileNumber}</a>
            {l.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />{l.email}</p>}
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" />{[l.address, l.city, l.state].filter(Boolean).join(', ')}</p>
            <p><span className="text-slate-400">Interested in:</span> {l.interestedService} · <span className="text-slate-400">Source:</span> {l.leadSource}</p>
            {l.nextFollowUpAt && <p className={l.isFollowUpOverdue ? 'text-rose-600 font-medium' : ''}>Next follow-up: {formatDateTime(l.nextFollowUpAt)}{l.isFollowUpOverdue ? ' (overdue)' : ''}</p>}
            {l.remarks && <p className="whitespace-pre-wrap text-slate-600">{l.remarks}</p>}
            {l.lostReason && <p className="text-rose-600">Lost: {l.lostReason}</p>}
          </div>

          <div className="flex gap-2">
            <button type="button" className={action} onClick={() => setSub('status')}>Update status</button>
            <button type="button" className={action} onClick={() => setSub('edit')}><Pencil className="w-3.5 h-3.5" /> Edit</button>
            <button type="button" className={action} onClick={() => setSub('followup')} disabled={closed} aria-label="Schedule follow-up"><CalendarPlus className="w-3.5 h-3.5" /> Follow-up</button>
          </div>
          {closed && <p className="text-[11px] text-slate-500">This lead is closed. Only your team leader can reopen it.</p>}

          <section>
            <h3 className="text-[13px] font-semibold text-slate-900 mb-2">Follow-ups</h3>
            {followUps.isLoading ? <p className="text-xs text-slate-400">Loading…</p>
              : followUps.data!.items.length === 0 ? <p className="text-xs text-slate-400">None scheduled.</p>
              : <ul className="space-y-3" data-testid="lead-followups">{followUps.data!.items.map((f) => <FollowUpCard key={f.id} f={f} />)}</ul>}
          </section>

          <section>
            <h3 className="text-[13px] font-semibold text-slate-900 mb-2">Add a note</h3>
            <form onSubmit={submitNote} className="space-y-2">
              <textarea aria-label="Add a note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} />
              {noteError && <p className="text-[11px] text-rose-600">{noteError}</p>}
              <button type="submit" disabled={noteState.isLoading || !note.trim()} className="btn btn-primary btn-sm"><Send className="w-3 h-3" /> Save note</button>
            </form>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold text-slate-900 mb-3">Timeline</h3>
            {activities.isLoading ? <p className="text-xs text-slate-400">Loading…</p> : <ActivityTimeline items={activities.data?.items ?? []} />}
          </section>
        </div>
      )}

      {l && sub === 'status' && <StatusSheet lead={l} onClose={() => setSub(null)} />}
      {l && sub === 'edit' && <LeadFormSheet lead={l} onClose={() => setSub(null)} />}
      {l && sub === 'followup' && <ScheduleFollowUpSheet leadId={l.id} onClose={() => setSub(null)} />}
    </Sheet>
  );
};
