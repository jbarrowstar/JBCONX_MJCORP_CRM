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
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">
            {canWrite ? 'Create teams, appoint team leaders and manage rosters.' : 'Your team and its roster.'}
          </p>
        </div>
        <div className="page-actions">
          {canWrite && (
            <div className="relative w-full sm:w-64">
              <Search className="control-icon" />
              <input
                type="search"
                aria-label="Search teams"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams…"
                className="control w-full pl-9"
              />
            </div>
          )}
          {canWrite && (
            <button type="button" onClick={() => setFormFor('new')} className="btn btn-primary">
              <Plus className="w-4 h-4" /> Create team
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading teams…" />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Network}
          title={debounced ? 'No teams match your search' : canWrite ? 'No teams yet' : 'You are not part of a team yet'}
          hint={canWrite && !debounced ? 'Create a team, then add a leader and agents.' : undefined}
        />
      ) : (
        <>
          <div className={`grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 transition-opacity ${isFetching ? 'opacity-60' : ''}`} data-testid="team-grid">
            {data.items.map((team) => {
              const rate = team.leadCount > 0 ? Math.round((team.convertedCount / team.leadCount) * 100) : 0;
              return (
                <article key={team.id} data-testid="team-card" className={`card flex flex-col transition-shadow hover:shadow-raised ${team.isActive ? '' : 'opacity-80'}`}>
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 flex items-center justify-center flex-shrink-0">
                          <Network className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-semibold text-slate-900 truncate">
                            {team.name}
                            {!team.isActive && <span className="ml-2 badge bg-slate-100 text-slate-500 border-slate-200 align-middle">Inactive</span>}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 min-w-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                            <span className="truncate">
                              Team leader: <strong className="font-medium text-slate-700">{team.leader?.name ?? 'Not assigned'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex items-center flex-shrink-0 -mr-1.5 -mt-1">
                          <button type="button" onClick={() => setFormFor(team)} className="icon-btn w-8 h-8 hover:!text-brand-700" aria-label={`Edit ${team.name}`}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setDeleteFor(team)} className="icon-btn w-8 h-8 hover:!text-rose-600 hover:!bg-rose-50" aria-label={`Delete ${team.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {team.description && <p className="text-[13px] text-slate-500 mt-3 line-clamp-2">{team.description}</p>}

                    <dl className="mt-5 grid grid-cols-3 rounded-lg border border-slate-200/80 divide-x divide-slate-200/80 text-center">
                      <div className="py-3">
                        <dt className="text-2xs font-medium text-slate-500">Agents</dt>
                        <dd className="font-display text-lg font-bold text-slate-900 tabular-nums">{team.agentCount}</dd>
                      </div>
                      <div className="py-3">
                        <dt className="text-2xs font-medium text-slate-500">Leads</dt>
                        <dd className="font-display text-lg font-bold text-slate-900 tabular-nums">{team.leadCount}</dd>
                      </div>
                      <div className="py-3">
                        <dt className="text-2xs font-medium text-emerald-700">Converted</dt>
                        <dd className="font-display text-lg font-bold text-emerald-700 tabular-nums">{team.convertedCount}</dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>Conversion rate</span>
                        <span className="font-semibold text-slate-900 tabular-nums">{rate}%</span>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${Math.min(100, rate)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Created {formatDate(team.createdAt)}</span>
                    <button type="button" onClick={() => setRosterFor(team)} className="link text-[13px]">
                      {canWrite ? 'Manage roster →' : 'View roster →'}
                    </button>
                  </div>
                </article>
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
