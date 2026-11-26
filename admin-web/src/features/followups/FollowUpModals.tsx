import React, { useState } from 'react';
import {
  FOLLOWUP_TYPES, FOLLOWUP_TYPE_LABELS, isoToLocalInput, localInputToIso, tomorrowTenAmLocal,
  type FollowUpDto, type FollowUpTypeValue,
} from '@shared/api/crm';
import { normalizeError } from '@shared/api/errors';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch } from '../../redux/hooks';
import {
  useCancelFollowUpMutation, useCompleteFollowUpMutation, useCreateFollowUpMutation, useUpdateFollowUpMutation,
} from '../../redux/services/crmApi';
import { pushToast } from '../../redux/slices/toastSlice';

const input = 'control w-full';
const label = 'block text-xs font-semibold text-slate-700 mb-1';

/** Create (pass `leadId`) or reschedule/edit (pass `followUp`) a follow-up. */
export const FollowUpFormModal: React.FC<{ leadId?: string; followUp?: FollowUpDto; onClose: () => void }> = ({ leadId, followUp, onClose }) => {
  const dispatch = useAppDispatch();
  const [create, c] = useCreateFollowUpMutation();
  const [update, u] = useUpdateFollowUpMutation();
  const [type, setType] = useState<FollowUpTypeValue>(followUp?.type ?? 'call');
  const [dueAt, setDueAt] = useState(followUp ? isoToLocalInput(followUp.dueAt) : tomorrowTenAmLocal());
  const [notes, setNotes] = useState(followUp?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const busy = c.isLoading || u.isLoading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!dueAt) {
      setError('Choose a date and time.');
      return;
    }
    try {
      if (followUp) {
        await update({ id: followUp.id, changes: { type, dueAt: localInputToIso(dueAt), notes: notes.trim() || null } }).unwrap();
        dispatch(pushToast('success', 'Follow-up updated.'));
      } else {
        await create({ leadId: leadId!, type, dueAt: localInputToIso(dueAt), ...(notes.trim() && { notes: notes.trim() }) }).unwrap();
        dispatch(pushToast('success', 'Follow-up scheduled.'));
      }
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };

  return (
    <Modal title={followUp ? 'Reschedule follow-up' : 'Schedule follow-up'} onClose={onClose} busy={busy} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <InlineError message={error} />
        <div>
          <label htmlFor="fu-type" className={label}>Type</label>
          <select id="fu-type" value={type} onChange={(e) => setType(e.target.value as FollowUpTypeValue)} className={input}>
            {FOLLOWUP_TYPES.map((t) => <option key={t} value={t}>{FOLLOWUP_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="fu-due" className={label}>Due date & time</label>
          <input id="fu-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="fu-notes" className={label}>Notes</label>
          <textarea id="fu-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={input} />
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? 'Saving…' : followUp ? 'Save' : 'Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const CompleteFollowUpModal: React.FC<{ followUp: FollowUpDto; onClose: () => void }> = ({ followUp, onClose }) => {
  const dispatch = useAppDispatch();
  const [complete, { isLoading }] = useCompleteFollowUpMutation();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await complete({ id: followUp.id, ...(notes.trim() && { outcomeNotes: notes.trim() }) }).unwrap();
      dispatch(pushToast('success', 'Follow-up marked as completed.'));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };
  return (
    <Modal title="Complete follow-up" onClose={onClose} busy={isLoading} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <InlineError message={error} />
        <p className="text-xs text-slate-500">{FOLLOWUP_TYPE_LABELS[followUp.type]} with {followUp.lead?.customerName ?? 'customer'}</p>
        <div>
          <label htmlFor="cf-notes" className={label}>Outcome notes</label>
          <textarea id="cf-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={input} placeholder="What was agreed or discussed?" />
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-60">
            {isLoading ? 'Saving…' : 'Mark completed'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const CancelFollowUpModal: React.FC<{ followUp: FollowUpDto; onClose: () => void }> = ({ followUp, onClose }) => {
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
    <Modal title="Cancel follow-up" onClose={onClose} busy={isLoading} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <InlineError message={error} />
        <div>
          <label htmlFor="cx-reason" className={label}>Reason (optional)</label>
          <textarea id="cx-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="btn btn-ghost">Keep it</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-60">
            {isLoading ? 'Cancelling…' : 'Cancel follow-up'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
