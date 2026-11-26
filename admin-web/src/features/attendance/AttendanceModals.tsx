import React, { useState } from 'react';
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS, type AttendanceDto, type AttendanceStatusValue } from '@shared/api/fieldwork';
import { localInputToIso } from '@shared/api/crm';
import { normalizeError } from '@shared/api/errors';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch } from '../../redux/hooks';
import { useCorrectAttendanceMutation, useMarkAttendanceMutation } from '../../redux/services/fieldApi';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { pushToast } from '../../redux/slices/toastSlice';

const input = 'w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]';
const label = 'block text-xs font-semibold text-slate-700 mb-1';

export const MarkAttendanceModal: React.FC<{ today: string; onClose: () => void }> = ({ today, onClose }) => {
  const dispatch = useAppDispatch();
  const [mark, { isLoading }] = useMarkAttendanceMutation();
  const { data: agents } = useListStaffQuery({ role: 'field_agent', limit: 100, sort: 'name', order: 'asc' });
  const [agentId, setAgentId] = useState('');
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState<AttendanceStatusValue>('absent');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agentId) return setError('Choose an agent.');
    if (!date) return setError('Choose a date.');
    try {
      await mark({ agentId, date, status, ...(remarks.trim() && { remarks: remarks.trim() }) }).unwrap();
      dispatch(pushToast('success', `Marked ${ATTENDANCE_STATUS_LABELS[status].toLowerCase()} for ${date}.`));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };

  return (
    <Modal title="Mark attendance" onClose={onClose} busy={isLoading} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <InlineError message={error} />
        <p className="text-[11px] text-slate-500">Use this for absences and approved leave. Days where the agent already checked in cannot be overwritten; correct the check-out instead.</p>
        <div>
          <label htmlFor="ma-agent" className={label}>Agent</label>
          <select id="ma-agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} className={input}>
            <option value="">Select an agent…</option>
            {agents?.items.map((a) => <option key={a.id} value={a.id}>{a.name}{a.team ? ` — ${a.team.name}` : ''}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ma-date" className={label}>Date</label>
            <input id="ma-date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="ma-status" className={label}>Status</label>
            <select id="ma-status" value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatusValue)} className={input}>
              {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="ma-remarks" className={label}>Remarks</label>
          <textarea id="ma-remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={input} />
        </div>
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-lg disabled:opacity-60">{isLoading ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
};

export const CorrectCheckOutModal: React.FC<{ record: AttendanceDto; onClose: () => void }> = ({ record, onClose }) => {
  const dispatch = useAppDispatch();
  const [correct, { isLoading }] = useCorrectAttendanceMutation();
  const [when, setWhen] = useState(''); // blank = "now" (server time)
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!remarks.trim()) return setError('Explain the correction (it is kept in the audit log).');
    try {
      await correct({ id: record.id, ...(when && { checkOutAt: localInputToIso(when) }), remarks: remarks.trim() }).unwrap();
      dispatch(pushToast('success', 'Check-out recorded.'));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };

  return (
    <Modal title={`Fix check-out — ${record.agent?.name ?? ''}`} onClose={onClose} busy={isLoading} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <InlineError message={error} />
        <p className="text-[11px] text-slate-500">For an agent who forgot to check out on {record.date}. The time must be after the check-in and not in the future.</p>
        <div>
          <label htmlFor="cc-when" className={label}>Check-out time</label>
          <input id="cc-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={input} />
          <p className="text-[11px] text-slate-400 mt-1">Leave empty to record the current time.</p>
        </div>
        <div>
          <label htmlFor="cc-remarks" className={label}>Reason *</label>
          <textarea id="cc-remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={input} />
        </div>
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-lg disabled:opacity-60">{isLoading ? 'Saving…' : 'Record check-out'}</button>
        </div>
      </form>
    </Modal>
  );
};
