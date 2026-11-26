import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Download } from 'lucide-react';
import {
  ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_STYLES, addDaysToKey, formatCoords, formatDuration, formatTime, mapsUrl, todayKeyInTz,
  type AttendanceDto, type AttendanceStatusValue, type GpsPoint,
} from '@shared/api/fieldwork';
import { errorMessage } from '@shared/api/errors';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { useAppSelector } from '../../redux/hooks';
import { useGetPublicSettingsQuery } from '../../redux/services/crmApi';
import { useGetDashboardQuery } from '../../redux/services/dashboardApi';
import { useListAttendanceQuery } from '../../redux/services/fieldApi';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { useListTeamsQuery } from '../../redux/services/teamApi';
import { exportToCSV } from '../../utils/exportUtils';
import { CorrectCheckOutModal, MarkAttendanceModal } from './AttendanceModals';

const Place: React.FC<{ p: GpsPoint | null }> = ({ p }) => {
  if (!p) return <span className="text-slate-300">—</span>;
  const hasGps = p.latitude != null && p.longitude != null;
  return (
    <div>
      <div className="font-medium text-slate-900 tabular-nums">{formatTime(p.at)}</div>
      {hasGps ? (
        <a href={mapsUrl(p.latitude!, p.longitude!)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs link">
          <MapPin className="w-3 h-3" /> {formatCoords(p.latitude, p.longitude)}
        </a>
      ) : <div className="cell-meta">No location</div>}
      <div className="flex flex-wrap gap-1 mt-1">
        {p.withinGeofence === false && <span className="badge bg-rose-50 text-rose-700 border-rose-200">Outside area{p.distanceMeters != null ? ` · ${p.distanceMeters} m` : ''}</span>}
        {p.withinGeofence === true && <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200">In area</span>}
        {p.lowAccuracy && <span className="badge bg-amber-50 text-amber-800 border-amber-200">Low accuracy{p.accuracy != null ? ` · ±${Math.round(p.accuracy)} m` : ''}</span>}
      </div>
    </div>
  );
};

export const AttendancePage: React.FC = () => {
  const actor = useAppSelector((s) => s.auth.user)!;
  const canWrite = actor.role === 'super_admin' || actor.role === 'marketing_manager';
  const isLeader = actor.role === 'team_leader';

  const [page, setPage] = useState(1);
  const { data: settings, isError: settingsFailed } = useGetPublicSettingsQuery();
  const today = todayKeyInTz(settings?.attendance.timezone);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // Default range: the last 7 days ending today in the ORGANISATION's timezone (set once, then user-controlled).
  useEffect(() => {
    if (!from && !to && (settings || settingsFailed)) {
      setTo(today);
      setFrom(addDaysToKey(today, -6));
    }
  }, [settings, settingsFailed, today, from, to]);
  const [agentId, setAgentId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [status, setStatus] = useState<'' | AttendanceStatusValue>('');
  const [marking, setMarking] = useState(false);
  const [fixing, setFixing] = useState<AttendanceDto | null>(null);

  useEffect(() => setPage(1), [from, to, agentId, teamId, status]);

  const rangeOk = !!from && !!to && from <= to;
  const { data: dash } = useGetDashboardQuery();
  const { data: teams } = useListTeamsQuery({ limit: 100 }, { skip: isLeader });
  const { data: agents } = useListStaffQuery({ role: 'field_agent', limit: 100, sort: 'name', order: 'asc', ...(teamId && { teamId }) });
  const { data, isLoading, isFetching, isError, error, refetch } = useListAttendanceQuery(
    { page, limit: 15, from, to, ...(agentId && { agentId }), ...(teamId && { teamId }), ...(status && { status }) },
    { skip: !rangeOk }
  );

  const sel = 'control';
  const t = dash?.attendanceToday;

  const exportPage = () =>
    exportToCSV(
      (data?.items ?? []).map((r) => ({
        date: r.date, agent: r.agent?.name ?? '', code: r.agent?.employeeCode ?? '', status: ATTENDANCE_STATUS_LABELS[r.status],
        checkIn: r.checkIn?.at ?? '', checkInLat: r.checkIn?.latitude ?? '', checkInLng: r.checkIn?.longitude ?? '',
        checkOut: r.checkOut?.at ?? '', hours: (r.workingMinutes / 60).toFixed(2), source: r.source, remarks: r.remarks ?? '',
      })),
      `attendance-${from}-to-${to}-page-${page}.csv`,
      [
        { key: 'date', label: 'Date' }, { key: 'agent', label: 'Agent' }, { key: 'code', label: 'Code' }, { key: 'status', label: 'Status' },
        { key: 'checkIn', label: 'Check-in' }, { key: 'checkInLat', label: 'Check-in lat' }, { key: 'checkInLng', label: 'Check-in lng' },
        { key: 'checkOut', label: 'Check-out' }, { key: 'hours', label: 'Hours' }, { key: 'source', label: 'Source' }, { key: 'remarks', label: 'Remarks' },
      ]
    );

  const stat = (id: string, text: string, value: number | undefined, dot: string) => (
    <div className="px-5 py-4">
      <p className="metric-label flex items-center gap-2"><span className={`dot ${dot}`} aria-hidden />{text}</p>
      <p data-testid={`today-${id}`} className="font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums mt-1">{value ?? '—'}</p>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visits &amp; Attendance</h1>
          <p className="page-subtitle">Check-ins and check-outs recorded by field agents{isLeader ? ' in your team' : ''}.</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={exportPage} disabled={!data?.items.length} title="Exports the rows shown on this page" className="btn btn-secondary">
            <Download className="w-4 h-4" /> Export this page
          </button>
          {canWrite && (
            <button type="button" onClick={() => setMarking(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" /> Mark attendance
            </button>
          )}
        </div>
      </div>

      <section className="card overflow-hidden" aria-label="Attendance today">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="section-label">Today</h2>
          {t && t.totalAgents > 0 && (
            <span className="text-xs text-slate-500 tabular-nums">{Math.round(((t.present + t.halfDay) / t.totalAgents) * 100)}% of agents checked in</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {stat('present', 'Present today', t ? t.present + t.halfDay : undefined, 'bg-emerald-500')}
          {stat('leave', 'On leave', t?.onLeave, 'bg-brand-400')}
          {stat('absent', 'Absent', t?.absent, 'bg-rose-500')}
          {stat('unmarked', 'Not marked yet', t?.notMarked, 'bg-amber-400')}
          {stat('agents', 'Active agents', t?.totalAgents, 'bg-slate-400')}
        </div>
        {t && t.totalAgents > 0 && (
          <div className="flex h-1.5 w-full bg-slate-100" aria-hidden>
            <span className="bg-emerald-500" style={{ width: `${((t.present + t.halfDay) / t.totalAgents) * 100}%` }} />
            <span className="bg-brand-400" style={{ width: `${(t.onLeave / t.totalAgents) * 100}%` }} />
            <span className="bg-rose-500" style={{ width: `${(t.absent / t.totalAgents) * 100}%` }} />
            <span className="bg-amber-400" style={{ width: `${(t.notMarked / t.totalAgents) * 100}%` }} />
          </div>
        )}
      </section>

      <section className="card">
      <div className="toolbar sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label htmlFor="at-from" className="label">From</label>
          <input id="at-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={sel} />
        </div>
        <div>
          <label htmlFor="at-to" className="label">To</label>
          <input id="at-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={sel} />
        </div>
        <div className="hidden sm:block w-px h-9 bg-slate-200 mx-1" />
        {!isLeader && (
          <select aria-label="Filter by team" value={teamId} onChange={(e) => { setTeamId(e.target.value); setAgentId(''); }} className={sel}>
            <option value="">All teams</option>
            {teams?.items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        )}
        <select aria-label="Filter by agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} className={sel}>
          <option value="">All agents</option>
          {agents?.items.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as '' | AttendanceStatusValue)} className={sel}>
          <option value="">Any status</option>
          {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

 {!from && !to ? (
        <Spinner label="Loading…" />
      ) : !rangeOk ? (
        <div className="p-4"><EmptyState title="Pick a valid date range" hint="The start date must be on or before the end date." /></div>
      ) : isLoading ? (
        <Spinner label="Loading attendance…" />
      ) : isError ? (
        <div className="p-4"><ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /></div>
      ) : data!.items.length === 0 ? (
        <div className="p-4"><EmptyState title="No attendance records in this range" hint="Records appear when agents check in from the mobile app, or when you mark leave/absence." /></div>
      ) : (
        <>
          <div className={`table-scroll transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
            <table className="data-table min-w-[960px]" data-testid="attendance-table">
              <thead>
                <tr>
                  <th>Date</th><th>Agent</th><th>Check-in</th>
                  <th>Check-out</th><th>Hours</th><th>Status</th>
                  <th>Notes</th>{canWrite && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data!.items.map((r) => (
                  <tr key={r.id} data-testid="attendance-row" className="[&>td]:align-top">
                    <td className="font-medium text-slate-900 tabular-nums">{r.date}</td>
                    <td><div className="cell-primary">{r.agent?.name ?? '—'}</div><div className="cell-code">{r.agent?.employeeCode ?? ''}</div></td>
                    <td><Place p={r.checkIn} /></td>
                    <td>{r.isOpen ? <span className="badge bg-brand-50 text-brand-700 border-brand-200"><span className="dot bg-brand-500 animate-pulse" aria-hidden />Still checked in</span> : <Place p={r.checkOut} />}</td>
                    <td className="tabular-nums">{r.checkOut ? formatDuration(r.workingMinutes) : '—'}</td>
                    <td><span className={`badge ${ATTENDANCE_STATUS_STYLES[r.status]}`}>{ATTENDANCE_STATUS_LABELS[r.status]}</span>{r.source === 'admin' && <div className="cell-meta mt-1">Marked by admin</div>}</td>
                    <td className="max-w-[200px] truncate" title={r.remarks ?? undefined}>{r.remarks ?? '—'}</td>
                    {canWrite && (
                      <td className="text-right">
                        {r.isOpen && <button type="button" onClick={() => setFixing(r)} className="row-action text-brand-700 hover:bg-brand-50" aria-label={`Fix check-out for ${r.agent?.name}`}>Fix check-out</button>}
                      </td>
                    )}
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

      {marking && <MarkAttendanceModal today={today} onClose={() => setMarking(false)} />}
      {fixing && <CorrectCheckOutModal record={fixing} onClose={() => setFixing(null)} />}
    </div>
  );
};
