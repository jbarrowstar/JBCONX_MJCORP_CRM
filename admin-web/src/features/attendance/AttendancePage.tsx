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
  if (!p) return <span className="text-slate-400">—</span>;
  const hasGps = p.latitude != null && p.longitude != null;
  return (
    <div>
      <div className="font-semibold text-slate-800">{formatTime(p.at)}</div>
      {hasGps ? (
        <a href={mapsUrl(p.latitude!, p.longitude!)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[11px] text-[#274C77] hover:underline">
          <MapPin className="w-3 h-3" /> {formatCoords(p.latitude, p.longitude)}
        </a>
      ) : <div className="text-[11px] text-slate-400">No location</div>}
      <div className="flex flex-wrap gap-1 mt-0.5">
        {p.withinGeofence === false && <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded px-1.5">Outside area{p.distanceMeters != null ? ` · ${p.distanceMeters} m` : ''}</span>}
        {p.withinGeofence === true && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5">In area</span>}
        {p.lowAccuracy && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5">Low accuracy{p.accuracy != null ? ` · ±${Math.round(p.accuracy)} m` : ''}</span>}
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

  const sel = 'text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#274C77]';
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

  const stat = (id: string, text: string, value: number | undefined, tone: string) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{text}</p>
      <p data-testid={`today-${id}`} className={`text-2xl font-bold mt-1 ${tone}`}>{value ?? '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visits & Attendance</h1>
          <p className="text-sm text-slate-500">Check-ins and check-outs recorded by field agents{isLeader ? ' in your team' : ''}.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportPage} disabled={!data?.items.length} title="Exports the rows shown on this page" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Export this page
          </button>
          {canWrite && (
            <button type="button" onClick={() => setMarking(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Mark attendance
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stat('present', 'Present today', t ? t.present + t.halfDay : undefined, 'text-emerald-600')}
        {stat('leave', 'On leave', t?.onLeave, 'text-blue-600')}
        {stat('absent', 'Absent', t?.absent, 'text-rose-600')}
        {stat('unmarked', 'Not marked yet', t?.notMarked, 'text-amber-600')}
        {stat('agents', 'Active agents', t?.totalAgents, 'text-slate-900')}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="at-from" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From</label>
          <input id="at-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={sel} />
        </div>
        <div>
          <label htmlFor="at-to" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To</label>
          <input id="at-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={sel} />
        </div>
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
        <EmptyState title="Pick a valid date range" hint="The start date must be on or before the end date." />
      ) : isLoading ? (
        <Spinner label="Loading attendance…" />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : data!.items.length === 0 ? (
        <EmptyState title="No attendance records in this range" hint="Records appear when agents check in from the mobile app, or when you mark leave/absence." />
      ) : (
        <>
          <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
            <table className="w-full text-left border-collapse min-w-[960px]" data-testid="attendance-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th><th className="py-3 px-4">Agent</th><th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4">Check-out</th><th className="py-3 px-4">Hours</th><th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>{canWrite && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data!.items.map((r) => (
                  <tr key={r.id} data-testid="attendance-row" className="hover:bg-slate-50 align-top">
                    <td className="py-3 px-4 whitespace-nowrap font-medium">{r.date}</td>
                    <td className="py-3 px-4"><div className="font-semibold text-slate-900">{r.agent?.name ?? '—'}</div><div className="text-[11px] text-slate-400 font-mono">{r.agent?.employeeCode ?? ''}</div></td>
                    <td className="py-3 px-4"><Place p={r.checkIn} /></td>
                    <td className="py-3 px-4">{r.isOpen ? <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5">Still checked in</span> : <Place p={r.checkOut} />}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{r.checkOut ? formatDuration(r.workingMinutes) : '—'}</td>
                    <td className="py-3 px-4"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${ATTENDANCE_STATUS_STYLES[r.status]}`}>{ATTENDANCE_STATUS_LABELS[r.status]}</span>{r.source === 'admin' && <div className="text-[10px] text-slate-400 mt-0.5">Marked by admin</div>}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={r.remarks ?? undefined}>{r.remarks ?? '—'}</td>
                    {canWrite && (
                      <td className="py-3 px-4 text-right">
                        {r.isOpen && <button type="button" onClick={() => setFixing(r)} className="text-[11px] font-semibold text-[#274C77] hover:underline" aria-label={`Fix check-out for ${r.agent?.name}`}>Fix check-out</button>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data!.meta} onPage={setPage} busy={isFetching} />
        </>
      )}

      {marking && <MarkAttendanceModal today={today} onClose={() => setMarking(false)} />}
      {fixing && <CorrectCheckOutModal record={fixing} onClose={() => setFixing(null)} />}
    </div>
  );
};
