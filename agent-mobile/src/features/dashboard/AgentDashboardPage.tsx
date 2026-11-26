import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, Target, TrendingUp, UserCheck, RefreshCw } from 'lucide-react';
import { errorMessage } from '@shared/api/errors';
import { presetRange } from '@shared/api/reports';
import { useAppSelector } from '../../redux/hooks';
import { useGetAgentPerformanceQuery, useGetDashboardQuery } from '../../redux/services/dashboardApi';

const Tile: React.FC<{ id: string; label: string; value: React.ReactNode; hint?: string; tone?: string }> = ({ id, label, value, hint, tone = 'text-slate-900' }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p data-testid={`tile-${id}`} className={`text-2xl font-black mt-1 ${tone}`}>{value}</p>
    {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
  </div>
);

export const AgentDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dash = useGetDashboardQuery(undefined, { refetchOnMountOrArgChange: true });
  const range = useMemo(() => presetRange(30), []);
  const perf = useGetAgentPerformanceQuery(range, { refetchOnMountOrArgChange: true });

  const d = dash.data;
  const me = perf.data?.agents[0];
  const attendance = d
    ? d.attendanceToday.present > 0 ? 'Checked in today'
      : d.attendanceToday.halfDay > 0 ? 'Shift recorded today (under a full day)'
      : d.attendanceToday.onLeave > 0 ? 'On leave today'
      : d.attendanceToday.absent > 0 ? 'Marked absent today'
      : 'Not checked in yet'
    : '';

  return (
    <div className="space-y-4 pb-6">
      <div className="bg-gradient-to-br from-[#1B3B6F] via-[#274C77] to-[#6096BA] rounded-3xl p-5 text-white shadow-lg">
        <p className="text-[11px] font-semibold text-[#A3CEF1]">{user?.team?.name ?? 'No team yet'}</p>
        <h1 className="text-2xl font-black mt-1 tracking-tight">Welcome, {user?.name ?? 'Agent'}</h1>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-white/80 flex items-center gap-1.5"><UserCheck className="w-4 h-4" /><span data-testid="attendance-state">{attendance || '…'}</span></p>
          <button type="button" aria-label="Refresh dashboard" onClick={() => { void dash.refetch(); void perf.refetch(); }} className="p-1.5 rounded-full bg-white/15">
            <RefreshCw className={`w-4 h-4 ${dash.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {dash.isLoading ? (
        <p role="status" className="py-10 text-center text-xs text-slate-500">Loading your dashboard…</p>
      ) : dash.isError || !d ? (
        <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-3">
          {errorMessage(dash.error)} <button type="button" className="underline font-bold" onClick={() => void dash.refetch()}>Retry</button>
        </div>
      ) : (
        <>
          {d.followUps.overdue > 0 && (
            <Link to="/leads" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800" data-testid="overdue-banner">{d.followUps.overdue} overdue follow-up{d.followUps.overdue === 1 ? '' : 's'}</p>
                <p className="text-[11px] text-red-700">Tap to open My leads → Follow-ups</p>
              </div>
            </Link>
          )}

          {d.personal && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4" data-testid="target-card">
              <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-[#274C77]" /><h2 className="text-xs font-bold text-slate-800">Monthly target</h2></div>
              {d.personal.monthlyTarget ? (
                <>
                  <p className="text-sm text-slate-700"><span className="font-black text-lg text-slate-900" data-testid="target-converted">{d.personal.convertedThisMonth}</span> of {d.personal.monthlyTarget} leads converted this month</p>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-2" role="progressbar" aria-valuenow={d.personal.targetProgress ?? 0} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, d.personal.targetProgress ?? 0)}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1" data-testid="target-progress">{d.personal.targetProgress}% of target</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">No monthly target has been set for you. {d.personal.convertedThisMonth} lead(s) converted this month.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Tile id="open" label="Open leads" value={d.leads.pending} hint={`${d.leads.total} total`} />
            <Tile id="converted" label="Converted" value={d.leads.converted} hint={`${d.leads.conversionRate}% conversion`} tone="text-emerald-600" />
            <Tile id="overdue" label="Overdue follow-ups" value={d.followUps.overdue} tone={d.followUps.overdue ? 'text-red-600' : 'text-slate-900'} />
            <Tile id="due-today" label="Due today" value={d.followUps.dueToday} hint={`${d.followUps.pending} pending`} />
            <Tile id="visits-today" label="Visits today" value={d.visits.today} />
            <Tile id="lost" label="Lost" value={d.leads.lost} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-[#274C77]" /><h2 className="text-xs font-bold text-slate-800">My last 30 days</h2></div>
            {perf.isLoading ? <p className="text-xs text-slate-400">Loading…</p> : !me ? <p className="text-xs text-slate-400">No activity data.</p> : (
              <dl className="grid grid-cols-2 gap-y-2 text-xs" data-testid="activity-30d">
                {[
                  ['Converted', me.convertedInRange, 'won'], ['Customer visits', me.visitsInRange, 'visits'],
                  ['Follow-ups done', me.followUpsCompletedInRange, 'followups'], ['Days attended', me.attendanceDaysInRange, 'days'],
                ].map(([k, v, id]) => (
                  <div key={id as string}><dt className="text-slate-500">{k}</dt><dd className="font-black text-slate-900 text-base" data-testid={`act-${id}`}>{v}</dd></div>
                ))}
              </dl>
            )}
          </div>

          <Link to="/leads" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#274C77] text-white text-xs font-bold shadow">
            <CalendarClock className="w-4 h-4" /> Open my leads & follow-ups
          </Link>
        </>
      )}
    </div>
  );
};
