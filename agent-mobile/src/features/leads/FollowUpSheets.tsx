import React, { useState } from 'react';
import {
  FOLLOWUP_TYPES, FOLLOWUP_TYPE_LABELS, localInputToIso, tomorrowTenAmLocal, type FollowUpDto, type FollowUpTypeValue,
} from '@shared/api/crm';
import { normalizeError } from '@shared/api/errors';
import { Sheet, fieldClass, labelClass } from '../../components/common/Sheet';
import { useAppDispatch } from '../../redux/hooks';
import { useCancelFollowUpMutation, useCompleteFollowUpMutation, useCreateFollowUpMutation } from '../../redux/services/crmApi';
import { pushToast } from '../../redux/slices/toastSlice';

const Err: React.FC<{ m: string | null }> = ({ m }) => (m ? <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{m}</div> : null);
const Footer: React.FC<{ busy: boolean; onClose: () => void; label: string; tone?: string; busyLabel: string }> = ({ busy, onClose, label, tone = 'bg-[#274C77]', busyLabel }) => (
  <div className="flex gap-2 pt-2">
    <button type="button" onClick={onClose} disabled={busy} className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
    <button type="submit" disabled={busy} className={`flex-1 py-3 text-xs font-bold text-white rounded-xl disabled:opacity-60 ${tone}`}>{busy ? busyLabel : label}</button>
  </div>
);

export const ScheduleFollowUpSheet: React.FC<{ leadId: string; onClose: () => void }> = ({ leadId, onClose }) => {
  const dispatch = useAppDispatch();
  const [create, { isLoading }] = useCreateFollowUpMutation();
  const [type, setType] = useState<FollowUpTypeValue>('call');
  const [dueAt, setDueAt] = useState(tomorrowTenAmLocal());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueAt) return setError('Choose a date and time.');
    try {
      await create({ leadId, type, dueAt: localInputToIso(dueAt), ...(notes.trim() && { notes: notes.trim() }) }).unwrap();
      dispatch(pushToast('success', 'Follow-up scheduled.'));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };
  return (
    <Sheet title="Schedule follow-up" onClose={onClose} busy={isLoading}>
      <form onSubmit={submit} className="p-5 space-y-4">
        <Err m={error} />
        <div>
          <label htmlFor="m-fu-type" className={labelClass}>Type</label>
          <select id="m-fu-type" value={type} onChange={(e) => setType(e.target.value as FollowUpTypeValue)} className={fieldClass}>
            {FOLLOWUP_TYPES.map((t) => <option key={t} value={t}>{FOLLOWUP_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="m-fu-due" className={labelClass}>Due date & time</label>
          <input id="m-fu-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="m-fu-notes" className={labelClass}>Notes</label>
          <textarea id="m-fu-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} />
        </div>
        <Footer busy={isLoading} onClose={onClose} label="Schedule" busyLabel="Saving…" />
      </form>
    </Sheet>
  );
};

export const CompleteFollowUpSheet: React.FC<{ followUp: FollowUpDto; onClose: () => void }> = ({ followUp, onClose }) => {
  const dispatch = useAppDispatch();
  const [complete, { isLoading }] = useCompleteFollowUpMutation();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await complete({ id: followUp.id, ...(notes.trim() && { outcomeNotes: notes.trim() }) }).unwrap();
      dispatch(pushToast('success', 'Follow-up completed.'));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };
  return (
    <Sheet title="Complete follow-up" onClose={onClose} busy={isLoading}>
      <form onSubmit={submit} className="p-5 space-y-4">
        <Err m={error} />
        <p className="text-xs text-slate-500">{FOLLOWUP_TYPE_LABELS[followUp.type]} with {followUp.lead?.customerName ?? 'customer'}</p>
        <div>
          <label htmlFor="m-cf-notes" className={labelClass}>Outcome notes</label>
          <textarea id="m-cf-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} placeholder="What was agreed or discussed?" />
        </div>
        <Footer busy={isLoading} onClose={onClose} label="Mark completed" tone="bg-emerald-600" busyLabel="Saving…" />
      </form>
    </Sheet>
  );
};

export const CancelFollowUpSheet: React.FC<{ followUp: FollowUpDto; onClose: () => void }> = ({ followUp, onClose }) => {
  const dispatch = useAppDispatch();
  const [cancel, { isLoading }] = useCancelFollowUpMutation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cancel({ id: followUp.id, ...(reason.trim() && { reason: reason.trim() }) }).unwrap();
      dispatch(pushToast('success', 'Follow-up cancelled.'));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };
  return (
    <Sheet title="Cancel follow-up" onClose={onClose} busy={isLoading}>
      <form onSubmit={submit} className="p-5 space-y-4">
        <Err m={error} />
        <div>
          <label htmlFor="m-cx-reason" className={labelClass}>Reason (optional)</label>
          <textarea id="m-cx-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass} />
        </div>
        <Footer busy={isLoading} onClose={onClose} label="Cancel follow-up" tone="bg-rose-600" busyLabel="Cancelling…" />
      </form>
    </Sheet>
  );
};
