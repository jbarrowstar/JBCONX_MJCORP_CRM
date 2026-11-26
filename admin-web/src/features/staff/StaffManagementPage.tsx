import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Phone, Mail, Users, Pencil, KeyRound, Power, Target } from 'lucide-react';
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
  super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  marketing_manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  team_leader: 'bg-sky-50 text-sky-700 border-sky-200',
  field_agent: 'bg-teal-50 text-teal-700 border-teal-200',
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

  const input = 'text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#274C77]';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500">
            {canCreate
              ? 'Create and manage marketing managers, team leaders and field agents.'
              : 'People in your team. Only managers and administrators can change staff accounts.'}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setFormFor('new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add staff member
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading staff…" />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No staff found"
          hint={debouncedSearch || role || teamId || status ? 'Try changing or clearing the filters.' : canCreate ? 'Add your first staff member to get started.' : undefined}
        />
      ) : (
        <>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity ${isFetching ? 'opacity-60' : ''}`} data-testid="staff-grid">
            {data.items.map((u) => {
              const manageable = canManageRole(actor.role, u.role);
              return (
                <div key={u.id} data-testid="staff-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#A3CEF1] text-[#274C77] font-bold flex items-center justify-center text-sm shadow-inner flex-shrink-0">
                          {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">{u.name}</h3>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.employeeCode ?? '—'}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                          u.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <span className={`inline-block mt-3 px-2 py-0.5 rounded-md text-[10px] font-bold border ${ROLE_STYLES[u.role]}`}>{ROLE_LABELS[u.role]}</span>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.team?.name ?? (u.role === 'marketing_manager' || u.role === 'super_admin' ? 'Organisation-wide' : 'No team yet')}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.phone || '—'}</span>
                      </div>
                      {u.role === 'field_agent' && (
                        <div className="flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.targetLeadsMonthly != null ? `${u.targetLeadsMonthly} leads / month` : 'No target set'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400">
                      {u.joiningDate ? `Joined ${formatDate(u.joiningDate)}` : `Added ${formatDate(u.createdAt)}`}
                      {u.lastLoginAt ? ` · Last sign-in ${formatDate(u.lastLoginAt)}` : ' · Never signed in'}
                    </p>
                    {manageable && u.id !== actor.id && (
                      <div className="mt-2 flex items-center gap-1">
                        <button type="button" onClick={() => setFormFor(u)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#274C77] hover:bg-blue-50 rounded-md">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button type="button" onClick={() => setResetFor(u)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md">
                          <KeyRound className="w-3 h-3" /> Reset password
                        </button>
                        <button
                          type="button"
                          onClick={() => setToggleFor(u)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md ${u.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}`}
                        >
                          <Power className="w-3 h-3" /> {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination meta={data.meta} onPage={setPage} busy={isFetching} />
        </>
      )}

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
