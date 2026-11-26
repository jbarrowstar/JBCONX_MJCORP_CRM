import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, TrendingUp, Clock, CalendarCheck, AlertTriangle, RefreshCw, UserX, ClipboardCheck, ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LabelList, PieChart, Pie, Cell,
} from 'recharts';
import { LEAD_STATUS_LABELS, formatDateTime } from '@shared/api/crm';
import { errorMessage } from '@shared/api/errors';
import { monthLabel } from '@shared/api/reports';
import { ROLE_LABELS } from '@shared/auth/roles';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { CHART, ChartLegend, ChartTooltip, axisProps } from '../../components/charts/chartTheme';
import { useAppSelector } from '../../redux/hooks';
import { useGetDashboardQuery } from '../../redux/services/dashboardApi';

/* ── Pipeline headline metric (sits inside the shared overview card) ── */
interface MetricProps {
  id: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  to?: string;
}

const Metric: React.FC<MetricProps> = ({ id, label, value, hint, icon: Icon, to }) => {
  const body = (
    <div className={`group h-full p-5 ${to ? 'hover:bg-slate-50/70 transition-colors' : ''}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <p className="metric-label">{label}</p>
        {to && <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-brand-600 transition-colors" />}
      </div>
      <p data-testid={`kpi-${id}`} className="metric-value mt-3">{value}</p>
      {hint && <p className="metric-hint mt-1">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block h-full">{body}</Link> : body;
};

/* ── "Today" operational tile ── */
interface TodayProps extends MetricProps {
  tone: 'neutral' | 'alert';
  footer?: React.ReactNode;
}

const TodayTile: React.FC<TodayProps> = ({ id, label, value, hint, icon: Icon, to, tone, footer }) => {
  const alert = tone === 'alert';
  const body = (
    <div className={`card h-full p-4 flex flex-col transition-colors ${alert ? 'border-rose-200 bg-rose-50/40' : ''} ${to ? 'hover:border-slate-300' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="metric-label">{label}</p>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${alert ? 'bg-rose-100 text-rose-600' : 'bg-brand-50 text-brand-600'}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p data-testid={`kpi-${id}`} className={`font-display text-2xl font-bold tracking-tight tabular-nums mt-1 ${alert ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
      {hint && <p className="metric-hint mt-0.5">{hint}</p>}
      {footer && <div className="mt-auto pt-3">{footer}</div>}
    </div>
  );
  return to ? <Link to={to} className="block h-full">{body}</Link> : body;
};

const ATTENDANCE_COLORS = {
  Present: '#12A283',
  'Half day': '#F59E0B',
  'On leave': '#6096BA',
  Absent: '#E11D48',
  'Not marked yet': '#CBD5E1',
} as const;

export const AdminDashboardPage: React.FC = () => {
  const actor = useAppSelector((s) => s.auth.user)!;
  const { data: d, isLoading, isFetching, isError, error, refetch } = useGetDashboardQuery(undefined, { refetchOnMountOrArgChange: true });

  const scope = actor.role === 'team_leader' ? `Your team${actor.team ? `: ${actor.team.name}` : ''}` : 'Whole organisation';
  const statusBars = d
    ? [
        { name: LEAD_STATUS_LABELS.new, value: d.leads.new },
        { name: LEAD_STATUS_LABELS.assigned, value: d.leads.assigned },
        { name: LEAD_STATUS_LABELS.contacted, value: d.leads.contacted },
        { name: LEAD_STATUS_LABELS.interested, value: d.leads.interested },
        { name: 'Meeting', value: d.leads.meetingScheduled },
        { name: LEAD_STATUS_LABELS.converted, value: d.leads.converted },
        { name: LEAD_STATUS_LABELS.lost, value: d.leads.lost },
      ]
    : [];
  const attendanceRows: [keyof typeof ATTENDANCE_COLORS, number][] = d
    ? [
        ['Present', d.attendanceToday.present], ['Half day', d.attendanceToday.halfDay], ['On leave', d.attendanceToday.onLeave],
        ['Absent', d.attendanceToday.absent], ['Not marked yet', d.attendanceToday.notMarked],
      ]
    : [];
  const checkedIn = d ? d.attendanceToday.present + d.attendanceToday.halfDay : 0;
  const checkedInPct = d && d.attendanceToday.totalAgents ? Math.round((checkedIn / d.attendanceToday.totalAgents) * 100) : 0;
  const maxSource = d?.sourceDistribution[0]?.total || 1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {ROLE_LABELS[actor.role]} view · <span data-testid="dashboard-scope">{scope}</span>
          </p>
        </div>
        <div className="page-actions">
          {d && <span className="text-xs text-slate-500">Updated {formatDateTime(d.generatedAt)}</span>}
          <button type="button" onClick={() => void refetch()} disabled={isFetching} className="btn btn-secondary">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading dashboard…" />
      ) : isError || !d ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          {/* Pipeline headline numbers */}
          <section className="card overflow-hidden" aria-label="Pipeline overview">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-slate-100 [&>*]:border-slate-100 [&>*:nth-child(odd)]:border-r lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0 [&>*:nth-child(-n+2)]:border-b lg:[&>*:nth-child(-n+2)]:border-b-0">
              <Metric id="total-leads" label="Total leads" value={d.leads.total} hint={`${d.leads.pending} still open`} icon={Users} to="/admin/leads" />
              <Metric id="converted" label="Converted" value={d.leads.converted} hint={`${d.leads.lost} lost`} icon={TrendingUp} />
              <Metric id="conversion-rate" label="Conversion rate" value={`${d.leads.conversionRate}%`} hint="converted ÷ all leads" icon={ClipboardCheck} />
              <Metric id="unassigned" label="Unassigned open leads" value={d.leads.unassigned} hint={d.leads.unassigned ? 'Need an owner' : 'All open leads have an owner'} icon={UserX} to="/admin/leads" />
            </div>
          </section>

          {/* Today */}
          <section aria-label="Today">
            <h2 className="section-label mb-3">Today</h2>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <TodayTile id="overdue" label="Overdue follow-ups" value={d.followUps.overdue} hint={d.followUps.overdue ? 'Needs attention' : 'Nothing overdue'} icon={AlertTriangle} tone={d.followUps.overdue ? 'alert' : 'neutral'} to="/admin/followups" />
              <TodayTile id="due-today" label="Follow-ups due today" value={d.followUps.dueToday} hint={`${d.followUps.pending} pending in total`} icon={Clock} tone="neutral" to="/admin/followups" />
              <TodayTile id="visits-today" label="Customer visits today" value={d.visits.today} hint="Recorded by field agents" icon={CalendarCheck} tone="neutral" />
              <TodayTile
                id="attendance"
                label="Agents checked in today"
                value={`${checkedIn} / ${d.attendanceToday.totalAgents}`}
                hint={`${d.attendanceToday.notMarked} not marked · ${d.attendanceToday.onLeave} on leave`}
                icon={UserCheck}
                tone="neutral"
                footer={<div className="progress" aria-hidden><span style={{ width: `${checkedInPct}%` }} /></div>}
              />
            </div>
          </section>

          {/* Trend + sources */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="card xl:col-span-2">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Leads created vs converted</h2>
                  <p className="card-subtitle">Last six months, by month of creation</p>
                </div>
                <ChartLegend items={[{ label: 'Created', color: CHART.primary }, { label: 'Converted', color: CHART.secondary }]} />
              </div>
              <div className="px-2 pb-4 pt-3">
                {d.monthlyTrend.length === 0 ? (
                  <div className="px-3"><EmptyState title="No leads created in this period" compact /></div>
                ) : (
                  <div className="h-72" data-testid="trend-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={d.monthlyTrend.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="g-created" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.18} />
                            <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="g-converted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART.secondary} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={CHART.secondary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke={CHART.grid} />
                        <XAxis dataKey="label" {...axisProps} dy={6} />
                        <YAxis allowDecimals={false} {...axisProps} width={44} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.muted, strokeDasharray: '3 3' }} />
                        <Area type="monotone" dataKey="created" name="Created" stroke={CHART.primary} strokeWidth={2} fill="url(#g-created)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
                        <Area type="monotone" dataKey="converted" name="Converted" stroke={CHART.secondary} strokeWidth={2} fill="url(#g-converted)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            <section className="card flex flex-col">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Lead sources</h2>
                  <p className="card-subtitle">Top sources and how many converted</p>
                </div>
              </div>
              <div className="p-5 pt-4 flex-1">
                {d.sourceDistribution.length === 0 ? (
                  <EmptyState title="No leads yet" compact />
                ) : (
                  <ul className="space-y-4" data-testid="source-list">
                    {d.sourceDistribution.map((s) => {
                      const rate = s.total ? Math.round((s.converted / s.total) * 100) : 0;
                      return (
                        <li key={s.source}>
                          <div className="flex items-baseline justify-between gap-3 text-[13px]">
                            <span className="font-medium text-slate-800 truncate">{s.source}</span>
                            <span className="text-xs text-slate-500 whitespace-nowrap tabular-nums">{s.total} leads · {s.converted} converted</span>
                          </div>
                          <div className="relative mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden" title={`${rate}% converted`}>
                            <div className="absolute inset-y-0 left-0 rounded-full bg-brand-200" style={{ width: `${Math.round((s.total / maxSource) * 100)}%` }} />
                            <div className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${Math.round((s.converted / maxSource) * 100)}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {d.sourceDistribution.length > 0 && (
                <div className="px-5 pb-4">
                  <ChartLegend items={[{ label: 'All leads', color: '#C6DAEF' }, { label: 'Converted', color: CHART.primary }]} />
                </div>
              )}
            </section>
          </div>

          {/* Pipeline + attendance */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="card xl:col-span-2">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Pipeline by status</h2>
                  <p className="card-subtitle">All leads in scope</p>
                </div>
              </div>
              <div className="h-64 px-2 pb-4 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBars} margin={{ top: 20, right: 16, left: -8, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid vertical={false} stroke={CHART.grid} />
                    <XAxis dataKey="name" {...axisProps} interval={0} dy={6} />
                    <YAxis allowDecimals={false} {...axisProps} width={44} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
                    <Bar dataKey="value" name="Leads" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={44}>
                      <LabelList dataKey="value" position="top" offset={8} style={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Attendance today</h2>
                  <p className="card-subtitle">{d.timezone}</p>
                </div>
              </div>
              <div className="p-5 pt-3">
                <div className="flex items-center gap-5">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceRows.some(([, v]) => v > 0) ? attendanceRows.map(([k, v]) => ({ name: k, value: v })) : [{ name: 'No agents', value: 1 }]}
                          dataKey="value"
                          innerRadius={38}
                          outerRadius={54}
                          paddingAngle={attendanceRows.filter(([, v]) => v > 0).length > 1 ? 2 : 0}
                          stroke="none"
                          isAnimationActive={false}
                        >
                          {(attendanceRows.some(([, v]) => v > 0) ? attendanceRows : [['Not marked yet', 1] as const]).map(([k]) => (
                            <Cell key={k} fill={ATTENDANCE_COLORS[k]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-display text-lg font-bold text-slate-900 tabular-nums">{checkedInPct}%</span>
                      <span className="text-[10px] text-slate-500">checked in</span>
                    </div>
                  </div>
                  <dl className="flex-1 min-w-0 space-y-2 text-[13px]" data-testid="attendance-breakdown">
                    {attendanceRows.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-2">
                        <dt className="flex items-center gap-2 text-slate-600 min-w-0"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ATTENDANCE_COLORS[k] }} />{k}</dt>
                        <dd className="font-semibold text-slate-900 tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <p className="text-xs text-slate-500 mt-5 pt-4 border-t border-slate-100">Attendance is recorded from the agent mobile app (check-in/out arrives in Phase 6/7).</p>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
