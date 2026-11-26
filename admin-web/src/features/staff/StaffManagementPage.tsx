import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Phone, Mail, Pencil, KeyRound, Power, X } from 'lucide-react';
import { errorMessage } from '@shared/api/errors';
import { canManageRole, creatableRoles, ROLE_LABELS } from '@shared/auth/roles';
import type { User, UserRole } from '@shared/types';
import { formatDate } from '@shared/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { useListStaffQuery, useSetStaffStatusMutation } from '../../redux/services/staffApi';
import { useListTeamsQuery } from '../../redux/services/teamApi';
import { pushToast } from '../../redux/slices/toastSlice';
import { ResetPasswordModal } from './ResetPasswordModal';
import { StaffFormModal } from './StaffFormModal';

const PAGE_SIZE = 12;

const ROLE_STYLES: Record<UserRole, string> = {
  super_admin: 'bg-brand-900 text-white border-brand-900',
  marketing_manager: 'bg-brand-50 text-brand-800 border-brand-200',
  team_leader: 'bg-sky-50 text-sky-800 border-sky-200',
  field_agent: 'bg-slate-50 text-slate-700 border-slate-200',
};

const useDebounced = <T,>(value: T, ms = 300): T => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

export const StaffManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user)!;
  const canCreate = creatableRoles(actor.role).length > 0;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'' | UserRole>('');
  const [teamId, setTeamId] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('');
  const debouncedSearch = useDebounced(search.trim());

  useEffect(() => setPage(1), [debouncedSearch, role, teamId, status]);

  const { data, isLoading, isFetching, isError, error, refetch } = useListStaffQuery({
    page,
    limit: PAGE_SIZE,
    sort: 'name',
    order: 'asc',
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(role && { role }),
    ...(teamId && { teamId }),
    ...(status && { isActive: status === 'active' }),
  });
  const { data: teams } = useListTeamsQuery({ limit: 100 });

  const [setActive, { isLoading: toggling }] = useSetStaffStatusMutation();
  const [formFor, setFormFor] = useState<User | 'new' | null>(null);
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [toggleFor, setToggleFor] = useState<User | null>(null);

  const confirmToggle = async () => {
    if (!toggleFor) return;
    try {
      await setActive({ id: toggleFor.id, isActive: !toggleFor.isActive }).unwrap();
      dispatch(pushToast('success', `${toggleFor.name} ${toggleFor.isActive ? 'deactivated' : 'activated'}.`));
      setToggleFor(null);
    } catch (err) {
      dispatch(pushToast('error', errorMessage(err)));
      setToggleFor(null);
    }
  };

  const input = 'control';
  const filtered = !!(debouncedSearch || role || teamId || status);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">
            {canCreate
              ? 'Create and manage marketing managers, team leaders and field agents.'
              : 'People in your team. Only managers and administrators can change staff accounts.'}
          </p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" onClick={() => setFormFor('new')} className="btn btn-primary">
              <Plus className="w-4 h-4" /> Add staff member
            </button>
          </div>
        )}
      </div>

      <section className="card">
        <div className="toolbar lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="control-icon" />
            <input
              type="search"
              aria-label="Search staff"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, code or phone…"
              className={`${input} w-full pl-9`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value as '' | UserRole)} className={input}>
              <option value="">All roles</option>
              {(Object.keys(ROLE_LABELS) as UserRole[])
                .filter((r) => actor.role === 'super_admin' || r !== 'super_admin')
                .map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
            </select>
            {actor.role !== 'team_leader' && (
              <select aria-label="Filter by team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className={input}>
                <option value="">All teams</option>
                {teams?.items.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as '' | 'active' | 'inactive')} className={input}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {filtered && (
              <button type="button" onClick={() => { setSearch(''); setRole(''); setTeamId(''); setStatus(''); }} className="btn btn-ghost btn-sm text-brand-700">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <Spinner label="Loading staff…" />
        ) : isError ? (
          <div className="p-4"><ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /></div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No staff found"
              hint={filtered ? 'Try changing or clearing the filters.' : canCreate ? 'Add your first staff member to get started.' : undefined}
            />
          </div>
        ) : (
          <>
            <div className={`table-scroll transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              <table className="data-table min-w-[920px]" data-testid="staff-grid">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role &amp; target</th>
                    <th>Team</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Activity</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => {
                    const manageable = canManageRole(actor.role, u.role);
                    return (
                      <tr key={u.id} data-testid="staff-card" className={u.isActive ? '' : 'bg-slate-50/60'}>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className={`avatar w-9 h-9 text-xs ${u.isActive ? '' : 'grayscale opacity-60'}`}>
                              {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <h3 className="cell-primary leading-tight truncate max-w-[200px]">{u.name}</h3>
                              <p className="cell-code mt-0.5">{u.employeeCode ?? '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${ROLE_STYLES[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                          {u.role === 'field_agent' && (
                            <div className={`text-xs mt-1 ${u.targetLeadsMonthly != null ? 'text-slate-500' : 'text-slate-400'}`}>{u.targetLeadsMonthly != null ? `${u.targetLeadsMonthly} leads / month` : 'No target set'}</div>
                          )}
                        </td>
                        <td className="text-slate-700">
                          <span>{u.team?.name ?? (u.role === 'marketing_manager' || u.role === 'super_admin' ? 'Organisation-wide' : 'No team yet')}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[220px]">{u.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 cell-meta mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{u.phone || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${u.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            <span className={`dot ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden />
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="cell-meta">
                          <div>{u.joiningDate ? `Joined ${formatDate(u.joiningDate)}` : `Added ${formatDate(u.createdAt)}`}</div>
                          <div className={u.lastLoginAt ? '' : 'text-amber-700'}>{u.lastLoginAt ? `Last sign-in ${formatDate(u.lastLoginAt)}` : 'Never signed in'}</div>
                        </td>
                        <td className="text-right">
                          {manageable && u.id !== actor.id ? (
                            <div className="inline-flex items-center gap-0.5">
                              <button type="button" onClick={() => setFormFor(u)} aria-label="Edit" title={`Edit ${u.name}`} className="icon-btn w-8 h-8 hover:!text-brand-700 hover:!bg-brand-50">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => setResetFor(u)} aria-label="Reset password" title="Reset password" className="icon-btn w-8 h-8">
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setToggleFor(u)}
                                aria-label={u.isActive ? 'Deactivate' : 'Activate'}
                                title={u.isActive ? 'Deactivate account' : 'Activate account'}
                                className={`icon-btn w-8 h-8 ${u.isActive ? 'hover:!text-rose-600 hover:!bg-rose-50' : '!text-emerald-600 hover:!bg-emerald-50'}`}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination meta={data.meta} onPage={setPage} busy={isFetching} />
            </div>
          </>
        )}
      </section>

      {formFor && <StaffFormModal staff={formFor === 'new' ? undefined : formFor} onClose={() => setFormFor(null)} />}
      {resetFor && <ResetPasswordModal staff={resetFor} onClose={() => setResetFor(null)} />}
      {toggleFor && (
        <ConfirmDialog
          title={toggleFor.isActive ? 'Deactivate account' : 'Activate account'}
          message={
            toggleFor.isActive
              ? `${toggleFor.name} will be signed out immediately and will not be able to sign in until reactivated.`
              : `${toggleFor.name} will be able to sign in again.`
          }
          confirmLabel={toggleFor.isActive ? 'Deactivate' : 'Activate'}
          danger={toggleFor.isActive}
          busy={toggling}
          onConfirm={() => void confirmToggle()}
          onCancel={() => setToggleFor(null)}
        />
      )}
    </div>
  );
};
