import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Download, Filter, UserCog } from 'lucide-react';
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

  const sel = 'text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#274C77]';
  const filtered = !!(debounced || status || priority || teamId || agentId || source || followUp || unassigned);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Management</h1>
          <p className="text-sm text-slate-500">Create, assign and track every lead through to conversion.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportPage} disabled={items.length === 0} title="Exports the rows currently shown on this page" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Export this page
          </button>
          <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm">
            <Plus className="w-3.5 h-3.5" /> New lead
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" aria-label="Search leads" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, email, code or city…" className={`${sel} w-full pl-9`} />
          </div>
          <select aria-label="Sort leads" value={sortKey} onChange={(e) => setSortKey(e.target.value)} className={sel}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
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
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} className="w-4 h-4 rounded border-slate-300" /> Unassigned only
          </label>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs">
          <span className="font-semibold text-[#274C77]">{selected.size} selected</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelected(new Set())} className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-white rounded-lg">Clear</button>
            <button type="button" onClick={() => setAssigning(selectedLeads)} className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-[#274C77] rounded-lg">
              <UserCog className="w-3.5 h-3.5" /> Assign selected
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Spinner label="Loading leads…" />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={filtered ? 'No leads match these filters' : 'No leads yet'} hint={filtered ? 'Try clearing a filter.' : 'Create the first lead with "New lead".'} />
      ) : (
        <>
          <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
            <table className="w-full text-left border-collapse min-w-[900px]" data-testid="lead-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-8"><input type="checkbox" aria-label="Select all leads on this page" checked={allOnPage} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300" /></th>
                  <th className="py-3 px-4">Lead</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Interest</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned to</th>
                  <th className="py-3 px-4">Next follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {items.map((l) => (
                  <tr key={l.id} data-testid="lead-row" className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4"><input type="checkbox" aria-label={`Select ${l.customerName}`} checked={selected.has(l.id)} onChange={() => toggle(l.id)} className="w-4 h-4 rounded border-slate-300" /></td>
                    <td className="py-3 px-4">
                      <button type="button" onClick={() => openLead(l.id)} className="text-left">
                        <div className="font-semibold text-slate-900 hover:underline">{l.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{l.leadCode} · {l.city}</div>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div>{l.mobileNumber}</div>
                      {l.email && <div className="text-[11px] text-slate-400">{l.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div>{l.interestedService}</div>
                      <div className="text-[11px] text-slate-400">{l.leadSource}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-1"><LeadStatusBadge status={l.status} /><PriorityBadge priority={l.priority} /></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{l.assignedAgent?.name ?? <span className="text-amber-600">Unassigned</span>}</div>
                      <div className="text-[11px] text-slate-400">{l.team?.name ?? '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {l.nextFollowUpAt ? (
                        <span className={l.isFollowUpOverdue ? 'text-red-600 font-semibold' : ''}>{formatDateTime(l.nextFollowUpAt)}{l.isFollowUpOverdue ? ' · overdue' : ''}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data!.meta} onPage={setPage} busy={isFetching} />
        </>
      )}

      {creating && <LeadFormModal onClose={() => setCreating(false)} onSaved={(l) => openLead(l.id)} />}
      {assigning && <AssignLeadModal leads={assigning} onClose={() => setAssigning(null)} onDone={() => setSelected(new Set())} />}
      {openId && <LeadDetailDrawer leadId={openId} onClose={() => openLead(null)} />}
    </div>
  );
};
