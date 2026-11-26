import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, TrendingUp, Clock, CalendarCheck, AlertTriangle, RefreshCw, UserX, ClipboardCheck } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar,
} from 'recharts';
import { LEAD_STATUS_LABELS, formatDateTime } from '@shared/api/crm';
import { errorMessage } from '@shared/api/errors';
import { monthLabel } from '@shared/api/reports';
import { ROLE_LABELS } from '@shared/auth/roles';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { useAppSelector } from '../../redux/hooks';
import { useGetDashboardQuery } from '../../redux/services/dashboardApi';

interface KpiProps {
  id: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  tone: string;
  to?: string;
}

const Kpi: React.FC<KpiProps> = ({ id, label, value, hint, icon: Icon, tone, to }) => {
  const body = (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors h-full">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}><Icon className="w-4.5 h-4.5" /></div>
      </div>
      <p data-testid={`kpi-${id}`} className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
};

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[actor.role]} view · <span data-testid="dashboard-scope">{scope}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {d && <span className="text-[11px] text-slate-400">Updated {formatDateTime(d.generatedAt)}</span>}
          <button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading dashboard…" />
      ) : isError || !d ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi id="total-leads" label="Total leads" value={d.leads.total} hint={`${d.leads.pending} still open`} icon={Users} tone="bg-blue-50 text-blue-600" to="/admin/leads" />
            <Kpi id="converted" label="Converted" value={d.leads.converted} hint={`${d.leads.lost} lost`} icon={TrendingUp} tone="bg-emerald-50 text-emerald-600" />
            <Kpi id="conversion-rate" label="Conversion rate" value={`${d.leads.conversionRate}%`} hint="converted ÷ all leads" icon={ClipboardCheck} tone="bg-indigo-50 text-indigo-600" />
            <Kpi id="unassigned" label="Unassigned open leads" value={d.leads.unassigned} hint={d.leads.unassigned ? 'Need an owner' : 'All open leads have an owner'} icon={UserX} tone="bg-amber-50 text-amber-600" to="/admin/leads" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi id="overdue" label="Overdue follow-ups" value={d.followUps.overdue} icon={AlertTriangle} tone="bg-red-50 text-red-600" to="/admin/followups" />
            <Kpi id="due-today" label="Follow-ups due today" value={d.followUps.dueToday} hint={`${d.followUps.pending} pending in total`} icon={Clock} tone="bg-orange-50 text-orange-600" to="/admin/followups" />
            <Kpi id="visits-today" label="Customer visits today" value={d.visits.today} icon={CalendarCheck} tone="bg-teal-50 text-teal-600" />
            <Kpi
              id="attendance"
              label="Agents checked in today"
              value={`${d.attendanceToday.present + d.attendanceToday.halfDay} / ${d.attendanceToday.totalAgents}`}
              hint={`${d.attendanceToday.notMarked} not marked · ${d.attendanceToday.onLeave} on leave`}
              icon={UserCheck}
              tone="bg-sky-50 text-sky-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Leads created vs converted</h2>
              <p className="text-[11px] text-slate-400 mb-4">Last six months, by month of creation</p>
              {d.monthlyTrend.length === 0 ? (
                <EmptyState title="No leads created in this period" />
              ) : (
                <div className="h-64" data-testid="trend-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={d.monthlyTrend.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="created" name="Created" stroke="#274C77" fill="#A3CEF1" />
                      <Area type="monotone" dataKey="converted" name="Converted" stroke="#059669" fill="#a7f3d0" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Lead sources</h2>
              <p className="text-[11px] text-slate-400 mb-3">Top sources and how many converted</p>
              {d.sourceDistribution.length === 0 ? (
                <EmptyState title="No leads yet" />
              ) : (
                <ul className="space-y-3" data-testid="source-list">
                  {d.sourceDistribution.map((s) => (
                    <li key={s.source}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{s.source}</span>
                        <span className="text-slate-500">{s.total} leads · {s.converted} converted</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#274C77] rounded-full" style={{ width: `${Math.round((s.total / d.sourceDistribution[0].total) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Pipeline by status</h2>
              <p className="text-[11px] text-slate-400 mb-4">All leads in scope</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Leads" fill="#274C77" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Attendance today</h2>
              <p className="text-[11px] text-slate-400 mb-3">{d.timezone}</p>
              <dl className="space-y-2 text-xs" data-testid="attendance-breakdown">
                {[
                  ['Present', d.attendanceToday.present], ['Half day', d.attendanceToday.halfDay], ['On leave', d.attendanceToday.onLeave],
                  ['Absent', d.attendanceToday.absent], ['Not marked yet', d.attendanceToday.notMarked],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <dt className="text-slate-600">{k}</dt>
                    <dd className="font-bold text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-[11px] text-slate-400 mt-3">Attendance is recorded from the agent mobile app (check-in/out arrives in Phase 6/7).</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
