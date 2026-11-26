import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Download, Filter, UserCog, ArrowUpDown, X } from 'lucide-react';
import { LeadStatusBadge, PriorityBadge } from '@shared/components/LeadBadges';
import {
  LEAD_STATUSES, LEAD_STATUS_LABELS, PRIORITIES, PRIORITY_LABELS, formatDateTime, type LeadDto, type PriorityValue,
} from '@shared/api/crm';
import { errorMessage } from '@shared/api/errors';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { useDebounced } from '../../hooks/useDebounced';
import { useAppSelector } from '../../redux/hooks';
import { useGetPublicSettingsQuery, useListLeadsQuery } from '../../redux/services/crmApi';
import type { LeadQuery } from '../../redux/services/crmApi';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { useListTeamsQuery } from '../../redux/services/teamApi';
import { exportToCSV } from '../../utils/exportUtils';
import { AssignLeadModal } from './AssignLeadModal';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { LeadFormModal } from './LeadFormModal';

const PAGE_SIZE = 15;

const SORTS: { value: string; label: string; sort: NonNullable<LeadQuery['sort']>; order: 'asc' | 'desc' }[] = [
  { value: 'new', label: 'Newest first', sort: 'createdAt', order: 'desc' },
  { value: 'old', label: 'Oldest first', sort: 'createdAt', order: 'asc' },
  { value: 'name', label: 'Customer A–Z', sort: 'customerName', order: 'asc' },
  { value: 'followup', label: 'Next follow-up (soonest)', sort: 'nextFollowUpAt', order: 'asc' },
  { value: 'updated', label: 'Recently updated', sort: 'updatedAt', order: 'desc' },
];

export const LeadManagementPage: React.FC = () => {
  const actor = useAppSelector((s) => s.auth.user)!;
  const isLeader = actor.role === 'team_leader';
  const [params, setParams] = useSearchParams();
  const openId = params.get('lead');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState<'' | PriorityValue>('');
  const [teamId, setTeamId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [source, setSource] = useState('');
  const [followUp, setFollowUp] = useState<'' | 'overdue' | 'today' | 'upcoming' | 'none'>('');
  const [unassigned, setUnassigned] = useState(false);
  const [sortKey, setSortKey] = useState('new');
  const debounced = useDebounced(search.trim());
  const sort = SORTS.find((s) => s.value === sortKey)!;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<LeadDto[] | null>(null);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debounced, status, priority, teamId, agentId, source, followUp, unassigned, sortKey]);

  const { data: settings } = useGetPublicSettingsQuery();
  const { data: teams } = useListTeamsQuery({ limit: 100 }, { skip: isLeader });
  const { data: agents } = useListStaffQuery({ role: 'field_agent', limit: 100, sort: 'name', order: 'asc', ...(teamId && { teamId }) });

  const query: LeadQuery = {
    page, limit: PAGE_SIZE, sort: sort.sort, order: sort.order,
    ...(debounced && { search: debounced }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(teamId && { teamId }),
    ...(agentId && { assignedAgentId: agentId }),
    ...(source && { leadSource: source }),
    ...(followUp && { followUp }),
    ...(unassigned && { unassigned: true }),
  };
  const { data, isLoading, isFetching, isError, error, refetch } = useListLeadsQuery(query);

  const items = data?.items ?? [];
  const allOnPage = items.length > 0 && items.every((l) => selected.has(l.id));
  const selectedLeads = useMemo(() => items.filter((l) => selected.has(l.id)), [items, selected]);

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allOnPage ? new Set() : new Set(items.map((l) => l.id)));

  const openLead = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('lead', id);
    else next.delete('lead');
    setParams(next, { replace: true });
  };

  const exportPage = () =>
    exportToCSV(
      items.map((l) => ({
        code: l.leadCode, customer: l.customerName, mobile: l.mobileNumber, email: l.email ?? '', city: l.city, state: l.state,
        source: l.leadSource, service: l.interestedService, status: LEAD_STATUS_LABELS[l.status], priority: PRIORITY_LABELS[l.priority],
        agent: l.assignedAgent?.name ?? '', team: l.team?.name ?? '', nextFollowUp: l.nextFollowUpAt ?? '', created: l.createdAt,
      })),
      `leads-page-${page}.csv`,
      [
        { key: 'code', label: 'Lead code' }, { key: 'customer', label: 'Customer' }, { key: 'mobile', label: 'Mobile' }, { key: 'email', label: 'Email' },
        { key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'source', label: 'Source' }, { key: 'service', label: 'Service' },
        { key: 'status', label: 'Status' }, { key: 'priority', label: 'Priority' }, { key: 'agent', label: 'Assigned agent' }, { key: 'team', label: 'Team' },
        { key: 'nextFollowUp', label: 'Next follow-up' }, { key: 'created', label: 'Created' },
      ]
    );


  const sel = 'control';
  const filtered = !!(debounced || status || priority || teamId || agentId || source || followUp || unassigned);
  const clearFilters = () => {
    setSearch(''); setStatus(''); setPriority(''); setTeamId(''); setAgentId(''); setSource(''); setFollowUp(''); setUnassigned(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lead Management</h1>
          <p className="page-subtitle">Create, assign and track every lead through to conversion.</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={exportPage} disabled={items.length === 0} title="Exports the rows currently shown on this page" className="btn btn-secondary">
            <Download className="w-4 h-4" /> Export this page
          </button>
          <button type="button" onClick={() => setCreating(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> New lead
          </button>
        </div>
      </div>

      <section className="card">
        {/* Search, sort and filters */}
        <div className="toolbar">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 min-w-0 sm:max-w-md">
              <Search className="control-icon" />
              <input type="search" aria-label="Search leads" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, email, code or city…" className={`${sel} w-full pl-9`} />
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select aria-label="Sort leads" value={sortKey} onChange={(e) => setSortKey(e.target.value)} className={`${sel} w-full sm:w-auto`}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1"><Filter className="w-3.5 h-3.5" /> Filters</span>
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
              <option value="">All statuses</option>
              <option value="new,assigned,contacted,interested,meeting_scheduled">Open leads</option>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
            </select>
            <select aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value as '' | PriorityValue)} className={sel}>
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
            {!isLeader && (
              <select aria-label="Filter by team" value={teamId} onChange={(e) => { setTeamId(e.target.value); setAgentId(''); }} className={sel}>
                <option value="">All teams</option>
                {teams?.items.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <select aria-label="Filter by agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} className={sel}>
              <option value="">All agents</option>
              {agents?.items.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select aria-label="Filter by source" value={source} onChange={(e) => setSource(e.target.value)} className={sel}>
              <option value="">Any source</option>
              {settings?.operational.leadSources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select aria-label="Filter by follow-up" value={followUp} onChange={(e) => setFollowUp(e.target.value as typeof followUp)} className={sel}>
              <option value="">Any follow-up</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due today</option>
              <option value="upcoming">Upcoming</option>
              <option value="none">None scheduled</option>
            </select>
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} className="checkbox" /> Unassigned only
            </label>
            {filtered && (
              <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm text-brand-700">
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 bg-brand-50 border-b border-brand-100 px-4 py-2.5 text-[13px] animate-fade-in">
            <span className="font-semibold text-brand-800">{selected.size} selected</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelected(new Set())} className="btn btn-ghost btn-sm">Clear</button>
              <button type="button" onClick={() => setAssigning(selectedLeads)} className="btn btn-primary btn-sm">
                <UserCog className="w-3.5 h-3.5" /> Assign selected
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <Spinner label="Loading leads…" />
        ) : isError ? (
          <div className="p-4"><ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /></div>
        ) : items.length === 0 ? (
          <div className="p-4"><EmptyState title={filtered ? 'No leads match these filters' : 'No leads yet'} hint={filtered ? 'Try clearing a filter.' : 'Create the first lead with "New lead".'} /></div>
        ) : (
          <>
            <div className={`table-scroll transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              <table className="data-table min-w-[960px]" data-testid="lead-table">
                <thead>
                  <tr>
                    <th className="w-10"><input type="checkbox" aria-label="Select all leads on this page" checked={allOnPage} onChange={toggleAll} className="checkbox" /></th>
                    <th>Lead</th>
                    <th>Contact</th>
                    <th>Interest</th>
                    <th>Status</th>
                    <th>Assigned to</th>
                    <th>Next follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((l) => (
                    <tr key={l.id} data-testid="lead-row" className={selected.has(l.id) ? '!bg-brand-50/60' : ''}>
                      <td><input type="checkbox" aria-label={`Select ${l.customerName}`} checked={selected.has(l.id)} onChange={() => toggle(l.id)} className="checkbox" /></td>
                      <td>
                        <button type="button" onClick={() => openLead(l.id)} className="group flex items-center gap-3 text-left">
                          <span className="avatar w-8 h-8 text-2xs">{l.customerName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</span>
                          <span className="min-w-0">
                            <span className="block cell-primary group-hover:text-brand-700 group-hover:underline underline-offset-2">{l.customerName}</span>
                            <span className="block cell-code">{l.leadCode} · {l.city}</span>
                          </span>
                        </button>
                      </td>
                      <td>
                        <div className="tabular-nums">{l.mobileNumber}</div>
                        {l.email && <div className="cell-meta">{l.email}</div>}
                      </td>
                      <td>
                        <div className="max-w-[220px] truncate" title={l.interestedService}>{l.interestedService}</div>
                        <div className="cell-meta">{l.leadSource}</div>
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-1.5"><LeadStatusBadge status={l.status} /><PriorityBadge priority={l.priority} /></div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-800">{l.assignedAgent?.name ?? <span className="text-amber-700">Unassigned</span>}</div>
                        <div className="cell-meta">{l.team?.name ?? '—'}</div>
                      </td>
                      <td className="whitespace-nowrap">
                        {l.nextFollowUpAt ? (
                          <>
                            <div className={l.isFollowUpOverdue ? 'text-rose-600 font-medium' : 'text-slate-700'}>{formatDateTime(l.nextFollowUpAt)}</div>
                            {l.isFollowUpOverdue && <div className="text-2xs font-semibold uppercase tracking-wide text-rose-600">Overdue</div>}
                          </>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination meta={data!.meta} onPage={setPage} busy={isFetching} />
            </div>
          </>
        )}
      </section>

      {creating && <LeadFormModal onClose={() => setCreating(false)} onSaved={(l) => openLead(l.id)} />}
      {assigning && <AssignLeadModal leads={assigning} onClose={() => setAssigning(null)} onDone={() => setSelected(new Set())} />}
      {openId && <LeadDetailDrawer leadId={openId} onClose={() => openLead(null)} />}
    </div>
  );
};
