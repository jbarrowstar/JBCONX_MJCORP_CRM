import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, Target, TrendingUp, UserCheck, RefreshCw, ArrowRight, Clock, MapPin } from 'lucide-react';
import { errorMessage } from '@shared/api/errors';
import { presetRange } from '@shared/api/reports';
import { useAppSelector } from '../../redux/hooks';
import { useGetAgentPerformanceQuery, useGetDashboardQuery } from '../../redux/services/dashboardApi';

const Tile: React.FC<{ id: string; label: string; value: React.ReactNode; hint?: string; tone?: string }> = ({ id, label, value, hint, tone = 'text-slate-900' }) => (
  <div className="card p-4">
    <p className="metric-label">{label}</p>
    <p data-testid={`tile-${id}`} className={`font-display text-[26px] leading-8 font-bold tracking-tight tabular-nums mt-1 ${tone}`}>{value}</p>
    {hint && <p className="metric-hint mt-0.5">{hint}</p>}
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
  const checkedIn = !!d && d.attendanceToday.present > 0;

  return (
    <div className="page">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-xl bg-brand-950 text-white px-5 py-6 sm:px-7 sm:py-7">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(44,116,184,0.45),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-brand-300">{user?.team?.name ?? 'No team yet'}</p>
            <h1 className="font-display text-2xl sm:text-[28px] font-bold tracking-tight mt-1">Welcome, {user?.name ?? 'Agent'}</h1>
            <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-slate-200">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${checkedIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300'}`}>
                <UserCheck className="w-3.5 h-3.5" />
              </span>
              <span data-testid="attendance-state">{attendance || '…'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!checkedIn && d && (
              <Link to="/attendance" className="btn bg-white text-brand-900 hover:bg-brand-50">
                <Clock className="w-4 h-4" /> Go to attendance
              </Link>
            )}
            <button
              type="button"
              aria-label="Refresh dashboard"
              onClick={() => { void dash.refetch(); void perf.refetch(); }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/15 ring-1 ring-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${dash.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {dash.isLoading ? (
        <p role="status" className="py-12 text-center text-[13px] text-slate-500">Loading your dashboard…</p>
      ) : dash.isError || !d ? (
        <div role="alert" className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-3">
          {errorMessage(dash.error)} <button type="button" className="underline font-semibold" onClick={() => void dash.refetch()}>Retry</button>
        </div>
      ) : (
        <>
          {d.followUps.overdue > 0 && (
            <Link to="/leads" className="group flex items-center gap-3.5 rounded-xl border border-rose-200 bg-rose-50/70 p-4 hover:bg-rose-50 transition-colors">
              <span className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-rose-800" data-testid="overdue-banner">{d.followUps.overdue} overdue follow-up{d.followUps.overdue === 1 ? '' : 's'}</p>
                <p className="text-xs text-rose-700">Tap to open My leads → Follow-ups</p>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Tile id="open" label="Open leads" value={d.leads.pending} hint={`${d.leads.total} total`} />
              <Tile id="converted" label="Converted" value={d.leads.converted} hint={`${d.leads.conversionRate}% conversion`} tone="text-emerald-600" />
              <Tile id="overdue" label="Overdue follow-ups" value={d.followUps.overdue} tone={d.followUps.overdue ? 'text-rose-600' : 'text-slate-900'} />
              <Tile id="due-today" label="Due today" value={d.followUps.dueToday} hint={`${d.followUps.pending} pending`} />
              <Tile id="visits-today" label="Visits today" value={d.visits.today} />
              <Tile id="lost" label="Lost" value={d.leads.lost} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/leads" className="btn btn-primary btn-lg w-full">
                <CalendarClock className="w-4 h-4" /> Open my leads &amp; follow-ups
              </Link>
              <Link to="/visits" className="btn btn-secondary btn-lg w-full">
                <MapPin className="w-4 h-4" /> Record a customer visit
              </Link>
            </div>
            </div>

            <div className="space-y-4">
              {d.personal && (
                <section className="card p-5" data-testid="target-card">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Target className="w-4 h-4" /></span>
                    <h2 className="card-title">Monthly target</h2>
                  </div>
                  {d.personal.monthlyTarget ? (
                    <>
                      <p className="text-[13px] text-slate-600"><span className="font-display font-bold text-2xl text-slate-900 tabular-nums" data-testid="target-converted">{d.personal.convertedThisMonth}</span> of {d.personal.monthlyTarget} leads converted this month</p>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3" role="progressbar" aria-valuenow={d.personal.targetProgress ?? 0} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-emerald-500 rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, d.personal.targetProgress ?? 0)}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5" data-testid="target-progress">{d.personal.targetProgress}% of target</p>
                    </>
                  ) : (
                    <p className="text-[13px] text-slate-500">No monthly target has been set for you. {d.personal.convertedThisMonth} lead(s) converted this month.</p>
                  )}
                </section>
              )}

              <section className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></span>
                  <h2 className="card-title">My last 30 days</h2>
                </div>
                {perf.isLoading ? <p className="text-[13px] text-slate-500">Loading…</p> : !me ? <p className="text-[13px] text-slate-500">No activity data.</p> : (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4" data-testid="activity-30d">
                    {[
                      ['Converted', me.convertedInRange, 'won'], ['Customer visits', me.visitsInRange, 'visits'],
                      ['Follow-ups done', me.followUpsCompletedInRange, 'followups'], ['Days attended', me.attendanceDaysInRange, 'days'],
                    ].map(([k, v, id]) => (
                      <div key={id as string}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-display font-bold text-slate-900 text-xl tabular-nums" data-testid={`act-${id}`}>{v}</dd></div>
                    ))}
                  </dl>
                )}
              </section>
            </div>
          </div>

        </>
      )}
    </div>
  );
};
