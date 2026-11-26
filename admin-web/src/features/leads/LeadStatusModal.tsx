import React, { useState } from 'react';
import { LEAD_STATUS_LABELS, STAFF_SETTABLE_STATUSES, type LeadDto, type LeadStatusValue } from '@shared/api/crm';
import { normalizeError } from '@shared/api/errors';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch } from '../../redux/hooks';
import { useChangeLeadStatusMutation } from '../../redux/services/crmApi';
import { pushToast } from '../../redux/slices/toastSlice';

export const LeadStatusModal: React.FC<{ lead: LeadDto; onClose: () => void }> = ({ lead, onClose }) => {
  const dispatch = useAppDispatch();
  const [change, { isLoading }] = useChangeLeadStatusMutation();
  const options = STAFF_SETTABLE_STATUSES.filter((s) => s !== lead.status);
  const [status, setStatus] = useState<LeadStatusValue>(options[0]);
  const [lostReason, setLostReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (status === 'lost' && lostReason.trim().length < 3) {
      setError('Give a reason for losing this lead (at least 3 characters).');
      return;
    }
    try {
      await change({ id: lead.id, status, ...(remarks.trim() && { remarks: remarks.trim() }), ...(status === 'lost' && { lostReason: lostReason.trim() }) }).unwrap();
      dispatch(pushToast('success', `Status changed to ${LEAD_STATUS_LABELS[status]}.`));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };

  const input = 'w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]';
  return (
    <Modal title={`Change status — ${lead.leadCode}`} onClose={onClose} busy={isLoading} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <InlineError message={error} />
        <p className="text-xs text-slate-500">Current status: <strong>{LEAD_STATUS_LABELS[lead.status]}</strong></p>
        <div>
          <label htmlFor="ls-status" className="block text-xs font-semibold text-slate-700 mb-1">New status</label>
          <select id="ls-status" value={status} onChange={(e) => setStatus(e.target.value as LeadStatusValue)} className={input}>
            {options.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        {status === 'lost' && (
          <div>
            <label htmlFor="ls-lost" className="block text-xs font-semibold text-slate-700 mb-1">Reason lost *</label>
            <textarea id="ls-lost" rows={2} value={lostReason} onChange={(e) => setLostReason(e.target.value)} className={input} />
          </div>
        )}
        {(status === 'converted' || status === 'lost') && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Closing a lead cancels its pending follow-ups.</p>
        )}
        <div>
          <label htmlFor="ls-remarks" className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
          <textarea id="ls-remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={input} />
        </div>
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-lg shadow-sm disabled:opacity-60">
            {isLoading ? 'Saving…' : 'Update status'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
