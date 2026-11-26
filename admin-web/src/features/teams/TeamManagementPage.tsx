import React, { useEffect, useState } from 'react';
import { Network, Plus, Trash2, Pencil, ShieldCheck, Search } from 'lucide-react';
import { errorMessage } from '@shared/api/errors';
import { canWriteTeams } from '@shared/auth/roles';
import { formatDate } from '@shared/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { useDeleteTeamMutation, useListTeamsQuery } from '../../redux/services/teamApi';
import type { Team } from '../../redux/services/teamApi';
import { pushToast } from '../../redux/slices/toastSlice';
import { TeamFormModal } from './TeamFormModal';
import { TeamRosterModal } from './TeamRosterModal';

const PAGE_SIZE = 12;

export const TeamManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user)!;
  const canWrite = canWriteTeams(actor.role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching, isError, error, refetch } = useListTeamsQuery({
    page,
    limit: PAGE_SIZE,
    ...(debounced && { search: debounced }),
  });
  const [deleteTeam, { isLoading: deleting }] = useDeleteTeamMutation();

  const [formFor, setFormFor] = useState<Team | 'new' | null>(null);
  const [rosterFor, setRosterFor] = useState<Team | null>(null);
  const [deleteFor, setDeleteFor] = useState<Team | null>(null);

  const confirmDelete = async () => {
    if (!deleteFor) return;
    try {
      await deleteTeam(deleteFor.id).unwrap();
      dispatch(pushToast('success', `Team "${deleteFor.name}" deleted.`));
    } catch (err) {
      dispatch(pushToast('error', errorMessage(err)));
    }
    setDeleteFor(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-sm text-slate-500">
            {canWrite ? 'Create teams, appoint team leaders and manage rosters.' : 'Your team and its roster.'}
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setFormFor('new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create team
          </button>
        )}
      </div>

      {canWrite && (
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search teams"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams…"
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274C77] text-slate-800"
          />
        </div>
      )}

      {isLoading ? (
        <Spinner label="Loading teams…" />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={debounced ? 'No teams match your search' : canWrite ? 'No teams yet' : 'You are not part of a team yet'}
          hint={canWrite && !debounced ? 'Create a team, then add a leader and agents.' : undefined}
        />
      ) : (
        <>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity ${isFetching ? 'opacity-60' : ''}`} data-testid="team-grid">
            {data.items.map((team) => {
              const rate = team.leadCount > 0 ? Math.round((team.convertedCount / team.leadCount) * 100) : 0;
              return (
                <div key={team.id} data-testid="team-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#274C77] flex items-center justify-center shadow-sm flex-shrink-0">
                          <Network className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {team.name}
                            {!team.isActive && <span className="ml-2 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 align-middle">Inactive</span>}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#274C77]" />
                            <span>
                              Team leader: <strong>{team.leader?.name ?? 'Not assigned'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button type="button" onClick={() => setFormFor(team)} className="p-1.5 text-slate-400 hover:text-[#274C77] rounded-lg hover:bg-blue-50" aria-label={`Edit ${team.name}`}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setDeleteFor(team)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" aria-label={`Delete ${team.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {team.description && <p className="text-xs text-slate-500 mt-3">{team.description}</p>}

                    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agents</span>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">{team.agentCount}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads</span>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">{team.leadCount}</p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Converted</span>
                        <p className="text-lg font-bold text-emerald-800 mt-0.5">{team.convertedCount}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Conversion rate</span>
                        <span className="font-semibold text-slate-800">{rate}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#274C77] rounded-full" style={{ width: `${Math.min(100, rate)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Created {formatDate(team.createdAt)}</span>
                    <button type="button" onClick={() => setRosterFor(team)} className="text-xs font-semibold text-[#274C77] hover:underline">
                      {canWrite ? 'Manage roster →' : 'View roster →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination meta={data.meta} onPage={setPage} busy={isFetching} />
        </>
      )}

      {formFor && <TeamFormModal team={formFor === 'new' ? undefined : formFor} onClose={() => setFormFor(null)} />}
      {rosterFor && <TeamRosterModal team={rosterFor} canEdit={canWrite} onClose={() => setRosterFor(null)} />}
      {deleteFor && (
        <ConfirmDialog
          title="Delete team"
          message={`Delete "${deleteFor.name}"? A team that still has agents or leads cannot be deleted. Deactivate it instead.`}
          confirmLabel="Delete team"
          danger
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteFor(null)}
        />
      )}
    </div>
  );
};
