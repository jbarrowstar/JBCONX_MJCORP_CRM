import React, { useEffect, useState } from 'react';
import { MapPin, Image as ImageIcon } from 'lucide-react';
import {
  VISIT_OUTCOMES, VISIT_OUTCOME_LABELS, VISIT_STATUSES, VISIT_STATUS_LABELS, formatCoords, localDayKey, mapsUrl,
  type VisitDto, type VisitOutcomeValue, type VisitStatusValue,
} from '@shared/api/fieldwork';
import { formatDateTime } from '@shared/api/crm';
import { errorMessage } from '@shared/api/errors';
import { customRange } from '@shared/api/reports';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { useAppSelector } from '../../redux/hooks';
import { useListVisitsQuery } from '../../redux/services/fieldApi';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { useListTeamsQuery } from '../../redux/services/teamApi';
import { VisitDrawer } from './VisitDrawer';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDayKey(d);
};

export const CustomerVisitsPage: React.FC = () => {
  const actor = useAppSelector((s) => s.auth.user)!;
  const isLeader = actor.role === 'team_leader';
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(localDayKey(new Date()));
  const [agentId, setAgentId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [outcome, setOutcome] = useState<'' | VisitOutcomeValue>('');
  const [status, setStatus] = useState<'' | VisitStatusValue>('');
  const [open, setOpen] = useState<VisitDto | null>(null);

  useEffect(() => setPage(1), [from, to, agentId, teamId, outcome, status]);

  const rangeOk = !!from && !!to && from <= to;
  const range = rangeOk ? customRange(from, to) : null;
  const { data: teams } = useListTeamsQuery({ limit: 100 }, { skip: isLeader });
  const { data: agents } = useListStaffQuery({ role: 'field_agent', limit: 100, sort: 'name', order: 'asc', ...(teamId && { teamId }) });
  const { data, isLoading, isFetching, isError, error, refetch } = useListVisitsQuery(
    { page, limit: 15, ...(range ?? {}), ...(agentId && { agentId }), ...(teamId && { teamId }), ...(outcome && { outcome }), ...(status && { status }) },
    { skip: !rangeOk }
  );

  const sel = 'control';

  const OUTCOME_STYLE: Record<string, string> = {
    interested: 'bg-violet-50 text-violet-700 border-violet-200',
    not_interested: 'bg-slate-100 text-slate-600 border-slate-200',
    follow_up_required: 'bg-amber-50 text-amber-800 border-amber-200',
    converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    not_available: 'bg-slate-50 text-slate-500 border-slate-200',
    other: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Visits</h1>
          <p className="page-subtitle">Visits recorded by field agents with GPS location, notes, outcome and photos.</p>
        </div>
      </div>

      <section className="card">
        <div className="toolbar sm:flex-row sm:flex-wrap sm:items-end">
          <div><label htmlFor="cv-from" className="label">From</label>
            <input id="cv-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={sel} /></div>
          <div><label htmlFor="cv-to" className="label">To</label>
            <input id="cv-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={sel} /></div>
          <div className="hidden sm:block w-px h-9 bg-slate-200 mx-1" />
          {!isLeader && (
            <select aria-label="Filter by team" value={teamId} onChange={(e) => { setTeamId(e.target.value); setAgentId(''); }} className={sel}>
              <option value="">All teams</option>{teams?.items.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <select aria-label="Filter by agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} className={sel}>
            <option value="">All agents</option>{agents?.items.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select aria-label="Filter by outcome" value={outcome} onChange={(e) => setOutcome(e.target.value as '' | VisitOutcomeValue)} className={sel}>
            <option value="">Any outcome</option>{VISIT_OUTCOMES.map((o) => <option key={o} value={o}>{VISIT_OUTCOME_LABELS[o]}</option>)}
          </select>
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as '' | VisitStatusValue)} className={sel}>
            <option value="">Any status</option>{VISIT_STATUSES.map((o) => <option key={o} value={o}>{VISIT_STATUS_LABELS[o]}</option>)}
          </select>
        </div>

        {!rangeOk ? (
          <div className="p-4"><EmptyState title="Pick a valid date range" hint="The start date must be on or before the end date." /></div>
        ) : isLoading ? (
          <Spinner label="Loading visits…" />
        ) : isError ? (
          <div className="p-4"><ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /></div>
        ) : data!.items.length === 0 ? (
          <div className="p-4"><EmptyState icon={MapPin} title="No customer visits in this range" hint="Visits appear when field agents record them from the mobile app." /></div>
        ) : (
          <>
            <div className={`table-scroll transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              <table className="data-table min-w-[960px]" data-testid="visit-table">
                <thead>
                  <tr>
                    <th>Visited</th><th>Customer</th><th>Agent</th>
                    <th>Outcome</th><th>Location</th><th>Notes</th><th>Photos</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.items.map((v) => (
                    <tr key={v.id} data-testid="visit-row" className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('a,button')) setOpen(v); }}>
                      <td className="tabular-nums text-slate-700">{formatDateTime(v.visitedAt)}</td>
                      <td>
                        <button type="button" onClick={() => setOpen(v)} className="group text-left">
                          <div className="cell-primary group-hover:text-brand-700 group-hover:underline underline-offset-2">{v.lead?.customerName ?? '—'}</div>
                          <div className="cell-code">{v.lead?.leadCode} · {v.lead?.city}</div>
                        </button>
                      </td>
                      <td>{v.agent?.name ?? '—'}</td>
                      <td>
                        <span className={`badge ${OUTCOME_STYLE[v.outcome] ?? OUTCOME_STYLE.other}`}>{VISIT_OUTCOME_LABELS[v.outcome]}</span>
                        {v.status !== 'completed' && <div className="text-xs text-amber-700 mt-1">{VISIT_STATUS_LABELS[v.status]}</div>}
                      </td>
                      <td><a href={mapsUrl(v.location.latitude, v.location.longitude)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs link"><MapPin className="w-3.5 h-3.5" />{formatCoords(v.location.latitude, v.location.longitude)}</a></td>
                      <td className="max-w-[260px]"><div className="truncate" title={v.notes}>{v.notes}</div></td>
                      <td>{v.photoCount > 0 ? <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600"><ImageIcon className="w-4 h-4 text-slate-400" />{v.photoCount}</span> : <span className="text-slate-300">—</span>}</td>
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
      {open && <VisitDrawer visit={open} onClose={() => setOpen(null)} />}
    </div>
  );
};
