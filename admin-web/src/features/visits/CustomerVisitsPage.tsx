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

  const sel = 'text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#274C77]';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Visits</h1>
        <p className="text-sm text-slate-500">Visits recorded by field agents with GPS location, notes, outcome and photos.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-3">
        <div><label htmlFor="cv-from" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From</label>
          <input id="cv-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={sel} /></div>
        <div><label htmlFor="cv-to" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To</label>
          <input id="cv-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={sel} /></div>
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
        <EmptyState title="Pick a valid date range" hint="The start date must be on or before the end date." />
      ) : isLoading ? (
        <Spinner label="Loading visits…" />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : data!.items.length === 0 ? (
        <EmptyState title="No customer visits in this range" hint="Visits appear when field agents record them from the mobile app." />
      ) : (
        <>
          <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
            <table className="w-full text-left border-collapse min-w-[920px]" data-testid="visit-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Visited</th><th className="py-3 px-4">Customer</th><th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Outcome</th><th className="py-3 px-4">Location</th><th className="py-3 px-4">Notes</th><th className="py-3 px-4">Photos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data!.items.map((v) => (
                  <tr key={v.id} data-testid="visit-row" className="hover:bg-slate-50 align-top">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDateTime(v.visitedAt)}</td>
                    <td className="py-3 px-4">
                      <button type="button" onClick={() => setOpen(v)} className="text-left">
                        <div className="font-semibold text-slate-900 hover:underline">{v.lead?.customerName ?? '—'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{v.lead?.leadCode} · {v.lead?.city}</div>
                      </button>
                    </td>
                    <td className="py-3 px-4">{v.agent?.name ?? '—'}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{VISIT_OUTCOME_LABELS[v.outcome]}</div>
                      {v.status !== 'completed' && <div className="text-[11px] text-amber-700">{VISIT_STATUS_LABELS[v.status]}</div>}
                    </td>
                    <td className="py-3 px-4"><a href={mapsUrl(v.location.latitude, v.location.longitude)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[11px] text-[#274C77] hover:underline"><MapPin className="w-3 h-3" />{formatCoords(v.location.latitude, v.location.longitude)}</a></td>
                    <td className="py-3 px-4 max-w-[240px]"><div className="truncate" title={v.notes}>{v.notes}</div></td>
                    <td className="py-3 px-4">{v.photoCount > 0 ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600"><ImageIcon className="w-3.5 h-3.5" />{v.photoCount}</span> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data!.meta} onPage={setPage} busy={isFetching} />
        </>
      )}
      {open && <VisitDrawer visit={open} onClose={() => setOpen(null)} />}
    </div>
  );
};
