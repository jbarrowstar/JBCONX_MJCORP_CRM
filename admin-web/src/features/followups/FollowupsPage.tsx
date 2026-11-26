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
  const sel = 'control';

  const card = (icon: React.ReactNode, label: string, value: number | undefined, tone: string, target?: Tab) => (
    <button
      type="button"
      onClick={target ? () => setTab(target) : undefined}
      disabled={!target}
      className={`card p-4 flex items-center gap-3.5 text-left transition-colors disabled:cursor-default ${target ? 'hover:border-slate-300' : ''} ${target && tab === target ? '!border-brand-300 ring-2 ring-brand-500/10' : ''}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <p className="metric-label">{label}</p>
        <p className="font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums" data-testid={`summary-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value ?? '—'}</p>
      </div>
    </button>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups &amp; Tasks</h1>
          <p className="page-subtitle">Calls, meetings and visits that are due. Schedule new ones from a lead.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {card(<AlarmClock className="w-5 h-5" />, 'Overdue', s?.overdue, 'bg-rose-50 text-rose-600', 'overdue')}
        {card(<Clock className="w-5 h-5" />, 'Due today', s?.dueToday, 'bg-amber-50 text-amber-600')}
        {card(<ListChecks className="w-5 h-5" />, 'Pending', s?.pending, 'bg-brand-50 text-brand-600', 'upcoming')}
        {card(<CheckCircle2 className="w-5 h-5" />, 'Completed', s?.completed, 'bg-emerald-50 text-emerald-600', 'completed')}
      </div>

      <section className="card">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 px-4 pt-2 border-b border-slate-200/80">
          <div role="tablist" className="flex gap-1 overflow-x-auto scroll-thin -mb-px">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className="tab">
                {t.label}{counts[t.id] != null ? ` (${counts[t.id]})` : ''}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-3">
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
          <div className="p-4"><ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /></div>
        ) : data!.items.length === 0 ? (
          <div className="p-4"><EmptyState icon={CheckCircle2} title={`No ${cfg.label.toLowerCase()} follow-ups`} hint={tab === 'overdue' ? 'Nothing is overdue. Nice.' : undefined} /></div>
        ) : (
          <>
            <div className={`table-scroll transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              <table className="data-table min-w-[900px]" data-testid="followup-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Customer</th>
                    <th>Agent</th>
                    <th>Due</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.items.map((f) => (
                    <tr key={f.id} data-testid="followup-row">
                      <td className="cell-primary">{FOLLOWUP_TYPE_LABELS[f.type]}</td>
                      <td>
                        {f.lead ? (
                          <Link to={`/admin/leads?lead=${f.lead.id}`} className="link">{f.lead.customerName}</Link>
                        ) : '—'}
                        <div className="cell-code">{f.lead?.leadCode}</div>
                      </td>
                      <td>{f.assignedAgent?.name ?? '—'}</td>
                      <td className={`tabular-nums ${f.isOverdue ? 'text-rose-600 font-medium' : ''}`}>{formatDateTime(f.dueAt)}</td>
                      <td className="max-w-[240px]">
                        <div className="truncate" title={f.notes ?? undefined}>{f.notes ?? '—'}</div>
                        {f.outcomeNotes && <div className="text-xs text-emerald-700 truncate" title={f.outcomeNotes}>Outcome: {f.outcomeNotes}</div>}
                      </td>
                      <td><FollowUpStatusBadge f={f} /></td>
                      <td className="text-right"><div className="inline-block"><FollowUpActions followUp={f} /></div></td>
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
    </div>
  );
};
