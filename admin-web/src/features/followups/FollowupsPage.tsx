import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlarmClock, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { FOLLOWUP_TYPES, FOLLOWUP_TYPE_LABELS, formatDateTime, type FollowUpTypeValue } from '@shared/api/crm';
import { errorMessage } from '@shared/api/errors';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { useFollowUpSummaryQuery, useListFollowUpsQuery } from '../../redux/services/crmApi';
import type { FollowUpQuery } from '../../redux/services/crmApi';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { FollowUpActions, FollowUpStatusBadge } from './FollowUpList';

type Tab = 'overdue' | 'upcoming' | 'completed' | 'cancelled';
const TABS: { id: Tab; label: string; status: NonNullable<FollowUpQuery['status']>; order: 'asc' | 'desc' }[] = [
  { id: 'overdue', label: 'Overdue', status: 'overdue', order: 'asc' },
  { id: 'upcoming', label: 'Upcoming', status: 'pending', order: 'asc' },
  { id: 'completed', label: 'Completed', status: 'completed', order: 'desc' },
  { id: 'cancelled', label: 'Cancelled', status: 'cancelled', order: 'desc' },
];

export const FollowupsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overdue');
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'' | FollowUpTypeValue>('');
  const [agentId, setAgentId] = useState('');
  const cfg = TABS.find((t) => t.id === tab)!;

  useEffect(() => setPage(1), [tab, type, agentId]);

  const summary = useFollowUpSummaryQuery();
  const { data: agents } = useListStaffQuery({ role: 'field_agent', limit: 100, sort: 'name', order: 'asc' });
  const { data, isLoading, isFetching, isError, error, refetch } = useListFollowUpsQuery({
    page, limit: 15, status: cfg.status, order: cfg.order,
    ...(type && { type }), ...(agentId && { assignedAgentId: agentId }),
  });

  const s = summary.data;
  const counts: Record<Tab, number | null> = {
    overdue: s?.overdue ?? null,
    upcoming: s ? s.pending - s.overdue : null,
    completed: s?.completed ?? null,
    cancelled: null,
  };
  const sel = 'text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#274C77]';

  const card = (icon: React.ReactNode, label: string, value: number | undefined, tone: string) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-900" data-testid={`summary-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value ?? '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-ups & Tasks</h1>
        <p className="text-sm text-slate-500">Calls, meetings and visits that are due. Schedule new ones from a lead.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {card(<AlarmClock className="w-5 h-5" />, 'Overdue', s?.overdue, 'bg-red-50 text-red-600')}
        {card(<Clock className="w-5 h-5" />, 'Due today', s?.dueToday, 'bg-amber-50 text-amber-600')}
        {card(<ListChecks className="w-5 h-5" />, 'Pending', s?.pending, 'bg-blue-50 text-blue-600')}
        {card(<CheckCircle2 className="w-5 h-5" />, 'Completed', s?.completed, 'bg-emerald-50 text-emerald-600')}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200">
        <div role="tablist" className="flex gap-1">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === t.id ? 'border-[#274C77] text-[#274C77]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {t.label}{counts[t.id] != null ? ` (${counts[t.id]})` : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-2">
          <select aria-label="Filter by type" value={type} onChange={(e) => setType(e.target.value as '' | FollowUpTypeValue)} className={sel}>
            <option value="">All types</option>
            {FOLLOWUP_TYPES.map((t) => <option key={t} value={t}>{FOLLOWUP_TYPE_LABELS[t]}</option>)}
          </select>
          <select aria-label="Filter by agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} className={sel}>
            <option value="">All agents</option>
            {agents?.items.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading follow-ups…" />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : data!.items.length === 0 ? (
        <EmptyState title={`No ${cfg.label.toLowerCase()} follow-ups`} hint={tab === 'overdue' ? 'Nothing is overdue. Nice.' : undefined} />
      ) : (
        <>
          <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
            <table className="w-full text-left border-collapse min-w-[860px]" data-testid="followup-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Due</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data!.items.map((f) => (
                  <tr key={f.id} data-testid="followup-row" className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{FOLLOWUP_TYPE_LABELS[f.type]}</td>
                    <td className="py-3 px-4">
                      {f.lead ? (
                        <Link to={`/admin/leads?lead=${f.lead.id}`} className="font-medium text-[#274C77] hover:underline">{f.lead.customerName}</Link>
                      ) : '—'}
                      <div className="text-[11px] text-slate-400 font-mono">{f.lead?.leadCode}</div>
                    </td>
                    <td className="py-3 px-4">{f.assignedAgent?.name ?? '—'}</td>
                    <td className={`py-3 px-4 whitespace-nowrap ${f.isOverdue ? 'text-red-600 font-semibold' : ''}`}>{formatDateTime(f.dueAt)}</td>
                    <td className="py-3 px-4 max-w-[220px]">
                      <div className="truncate" title={f.notes ?? undefined}>{f.notes ?? '—'}</div>
                      {f.outcomeNotes && <div className="text-emerald-700 truncate" title={f.outcomeNotes}>Outcome: {f.outcomeNotes}</div>}
                    </td>
                    <td className="py-3 px-4"><FollowUpStatusBadge f={f} /></td>
                    <td className="py-3 px-4 text-right"><div className="inline-block"><FollowUpActions followUp={f} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data!.meta} onPage={setPage} busy={isFetching} />
        </>
      )}
    </div>
  );
};
