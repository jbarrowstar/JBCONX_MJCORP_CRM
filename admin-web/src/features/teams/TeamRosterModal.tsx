import React, { useState } from 'react';
import { UserMinus, UserPlus } from 'lucide-react';
import { errorMessage } from '@shared/api/errors';
import { ROLE_LABELS } from '@shared/auth/roles';
import { Modal } from '../../components/common/Modal';
import { ErrorState, InlineError, Spinner } from '../../components/common/States';
import { useAppDispatch } from '../../redux/hooks';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { useAddTeamAgentsMutation, useListTeamMembersQuery, useRemoveTeamAgentMutation } from '../../redux/services/teamApi';
import type { Team } from '../../redux/services/teamApi';
import { pushToast } from '../../redux/slices/toastSlice';

export const TeamRosterModal: React.FC<{ team: Team; canEdit: boolean; onClose: () => void }> = ({ team, canEdit, onClose }) => {
  const dispatch = useAppDispatch();
  const members = useListTeamMembersQuery(team.id);
  const [removeAgent, removeState] = useRemoveTeamAgentMutation();
  const [addAgents, addState] = useAddTeamAgentsMutation();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  // Only fetched when the "add agents" panel is open and the user may edit.
  const candidates = useListStaffQuery(
    { role: 'field_agent', isActive: true, limit: 100, sort: 'name', order: 'asc' },
    { skip: !adding || !canEdit }
  );
  const memberIds = new Set(members.data?.map((m) => m.id));
  const available = (candidates.data?.items ?? []).filter((a) => !memberIds.has(a.id));
  const busy = removeState.isLoading || addState.isLoading;

  const doRemove = async (id: string, name: string) => {
    setServerError(null);
    try {
      await removeAgent({ id: team.id, agentId: id }).unwrap();
      dispatch(pushToast('success', `${name} removed from ${team.name}.`));
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  const doAdd = async () => {
    setServerError(null);
    try {
      await addAgents({ id: team.id, agentIds: selected }).unwrap();
      dispatch(pushToast('success', `${selected.length} agent(s) added to ${team.name}.`));
      setSelected([]);
      setAdding(false);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <Modal title={`${team.name} — roster`} onClose={onClose} size="lg" busy={busy}>
      <div className="p-5 space-y-4">
        <InlineError message={serverError} />

        {members.isLoading ? (
          <Spinner label="Loading roster…" />
        ) : members.isError ? (
          <ErrorState message={errorMessage(members.error)} onRetry={() => void members.refetch()} />
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl" data-testid="roster-list">
            {members.data!.length === 0 && <li className="p-4 text-xs text-slate-400 text-center">No members yet.</li>}
            {members.data!.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {ROLE_LABELS[m.role]} · {m.email}{!m.isActive ? ' · inactive' : ''}
                  </p>
                </div>
                {canEdit && m.role === 'field_agent' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void doRemove(m.id, m.name)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md disabled:opacity-50"
                    aria-label={`Remove ${m.name} from team`}
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#274C77] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100">
            <UserPlus className="w-3.5 h-3.5" /> Add agents
          </button>
        )}

        {canEdit && adding && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <p className="text-xs font-bold text-slate-700">Select field agents to add</p>
            {candidates.isLoading ? (
              <Spinner label="Loading agents…" />
            ) : candidates.isError ? (
              <ErrorState message={errorMessage(candidates.error)} onRetry={() => void candidates.refetch()} />
            ) : available.length === 0 ? (
              <p className="text-xs text-slate-400">All active field agents are already in this team.</p>
            ) : (
              <ul className="max-h-56 overflow-y-auto space-y-1" data-testid="agent-candidates">
                {available.map((a) => (
                  <li key={a.id}>
                    <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer text-xs">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
                      <span className="font-semibold text-slate-800">{a.name}</span>
                      <span className="text-slate-400 truncate">
                        {a.team ? `currently in ${a.team.name} — will move` : 'no team'}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setAdding(false); setSelected([]); }} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button
                type="button"
                disabled={selected.length === 0 || busy}
                onClick={() => void doAdd()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-lg disabled:opacity-50"
              >
                Add {selected.length || ''} selected
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
