import React, { useState } from 'react';
import { normalizeError } from '@shared/api/errors';
import type { LeadDto } from '@shared/api/crm';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { useAssignLeadMutation, useBulkAssignLeadsMutation } from '../../redux/services/crmApi';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { useListTeamsQuery } from '../../redux/services/teamApi';
import { pushToast } from '../../redux/slices/toastSlice';

interface Props {
  leads: LeadDto[];
  onClose: () => void;
  onDone?: () => void;
}

/** Assign or reassign one lead, or many at once. */
export const AssignLeadModal: React.FC<Props> = ({ leads, onClose, onDone }) => {
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user)!;
  const bulk = leads.length > 1;
  const first = leads[0];
  const isLeader = actor.role === 'team_leader';

  const [assign, one] = useAssignLeadMutation();
  const [bulkAssign, many] = useBulkAssignLeadsMutation();
  const [teamId, setTeamId] = useState(bulk ? '' : first.teamId ?? '');
  const [agentId, setAgentId] = useState(bulk ? '' : first.assignedAgentId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<{ id: string; reason: string }[]>([]);
  const busy = one.isLoading || many.isLoading;

  const { data: teams } = useListTeamsQuery({ limit: 100, isActive: true }, { skip: isLeader });
  const { data: agents } = useListStaffQuery({ role: 'field_agent', isActive: true, limit: 100, sort: 'name', order: 'asc', ...(teamId && { teamId }) });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFailures([]);
    if (!agentId && !teamId && !(!bulk && first.assignedAgentId)) {
      setError('Choose a team or an agent.');
      return;
    }
    try {
      if (!bulk) {
        await assign({ id: first.id, assignedAgentId: agentId || null, teamId: agentId ? undefined : teamId || null }).unwrap();
        dispatch(pushToast('success', agentId ? 'Lead assigned.' : 'Lead unassigned.'));
      } else {
        const r = await bulkAssign({ leadIds: leads.map((l) => l.id), assignedAgentId: agentId || undefined, teamId: agentId ? undefined : teamId || undefined }).unwrap();
        dispatch(pushToast(r.failed.length ? 'info' : 'success', `${r.assigned.length} lead(s) assigned${r.failed.length ? `, ${r.failed.length} failed` : ''}.`));
        if (r.failed.length) {
          setFailures(r.failed);
          onDone?.();
          return; // keep the dialog open so the user can read the reasons
        }
      }
      onDone?.();
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };

  const input = 'control w-full';
  const nameOf = (id: string) => leads.find((l) => l.id === id)?.leadCode ?? id;

  return (
    <Modal title={bulk ? `Assign ${leads.length} leads` : `Assign ${first.leadCode}`} onClose={onClose} busy={busy} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <InlineError message={error} />
        {!bulk && (
          <p className="text-xs text-slate-500">
            {first.customerName} · currently <strong>{first.assignedAgent?.name ?? 'unassigned'}</strong>
          </p>
        )}
        {!isLeader && (
          <div>
            <label htmlFor="al-team" className="label">Team</label>
            <select id="al-team" value={teamId} onChange={(e) => { setTeamId(e.target.value); setAgentId(''); }} className={input}>
              <option value="">No team</option>
              {teams?.items.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="al-agent" className="label">Agent</label>
          <select id="al-agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} className={input}>
            <option value="">{bulk ? 'Team only (no specific agent)' : 'Unassign / team only'}</option>
            {agents?.items.map((a) => <option key={a.id} value={a.id}>{a.name}{a.team ? ` — ${a.team.name}` : ''}</option>)}
          </select>
        </div>
        {failures.length > 0 && (
          <ul className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 space-y-1" role="alert">
            {failures.map((f) => <li key={f.id}><strong>{nameOf(f.id)}</strong>: {f.reason}</li>)}
          </ul>
        )}
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-ghost">{failures.length ? 'Close' : 'Cancel'}</button>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
