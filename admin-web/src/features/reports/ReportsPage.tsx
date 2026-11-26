import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CalendarRange } from 'lucide-react';
import { LEAD_STATUS_LABELS, PRIORITY_LABELS, type LeadStatusValue, type PriorityValue } from '@shared/api/crm';
import { errorMessage } from '@shared/api/errors';
import { RANGE_PRESETS, customRange, hours, presetRange, type DateRangeInput } from '@shared/api/reports';
import { EmptyState, ErrorState, Spinner } from '../../components/common/States';
import { useAppSelector } from '../../redux/hooks';
import {
  useGetAgentPerformanceQuery, useGetAttendanceSummaryQuery, useGetLeadFunnelQuery, useGetOnboardingProgressQuery,
  useGetTeamPerformanceQuery, useGetVisitSummaryQuery,
} from '../../redux/services/dashboardApi';
import { useListTeamsQuery } from '../../redux/services/teamApi';
import { CountList, DataTable, StatBlock, type Column } from './ReportParts';
import { CHART, ChartLegend, ChartTooltip, axisProps } from '../../components/charts/chartTheme';

type Tab = 'teams' | 'agents' | 'attendance' | 'visits' | 'onboarding' | 'funnel';
const TABS: { id: Tab; label: string }[] = [
  { id: 'teams', label: 'Team performance' },
  { id: 'agents', label: 'Agent performance' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'visits', label: 'Customer visits' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'funnel', label: 'Lead funnel' },
];

const Body: React.FC<{ q: { isLoading: boolean; isError: boolean; error?: unknown; refetch: () => unknown }; children: React.ReactNode }> = ({ q, children }) =>
  q.isLoading ? <Spinner label="Loading report…" /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} /> : <>{children}</>;

export const ReportsPage: React.FC = () => {
  const actor = useAppSelector((s) => s.auth.user)!;
  const isLeader = actor.role === 'team_leader';
  const [tab, setTab] = useState<Tab>('teams');
  const [preset, setPreset] = useState<string>('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [teamId, setTeamId] = useState('');
  const { data: teams } = useListTeamsQuery({ limit: 100 }, { skip: isLeader });

  // Stable query arguments: recomputed only when the user changes the range, never on re-render.
  const range = useMemo(() => {
    if (preset === 'custom') return customFrom && customTo && customFrom <= customTo ? customRange(customFrom, customTo) : null;
    return presetRange(RANGE_PRESETS.find((p) => p.id === preset)!.days);
  }, [preset, customFrom, customTo]);
  const args: DateRangeInput = { ...(range ?? {}), ...(teamId && { teamId }) };
  const skip = !range;

  const teamPerf = useGetTeamPerformanceQuery(args, { skip: skip || tab !== 'teams' });
  const agentPerf = useGetAgentPerformanceQuery(args, { skip: skip || tab !== 'agents' });
  const attendance = useGetAttendanceSummaryQuery(args, { skip: skip || tab !== 'attendance' });
  const visits = useGetVisitSummaryQuery(args, { skip: skip || tab !== 'visits' });
  const onboarding = useGetOnboardingProgressQuery(args, { skip: skip || tab !== 'onboarding' });
  const funnel = useGetLeadFunnelQuery(args, { skip: skip || tab !== 'funnel' });

  const sel = 'control';
  const rangeLabel = range ? `${new Date(range.from).toLocaleDateString()} – ${new Date(range.to).toLocaleDateString()}` : 'Choose a valid date range';
  const file = (name: string) => `${name}-${new Date().toISOString().slice(0, 10)}.csv`;

  const teamCols: Column<NonNullable<typeof teamPerf.data>['teams'][number]>[] = [
    { key: 'name', label: 'Team', render: (r) => <span className="cell-primary">{r.name}</span>, csv: (r) => r.name },
    { key: 'leader', label: 'Leader', render: (r) => r.leader?.name ?? '—', csv: (r) => r.leader?.name ?? '' },
    { key: 'agents', label: 'Agents', render: (r) => r.agents, align: 'right' },
    { key: 'total', label: 'Total leads', render: (r) => r.totalLeads, align: 'right' },
    { key: 'open', label: 'Open', render: (r) => r.openLeads, align: 'right' },
    { key: 'converted', label: 'Converted', render: (r) => r.converted, align: 'right' },
    { key: 'rate', label: 'Conversion', render: (r) => `${r.conversionRate}%`, csv: (r) => r.conversionRate, align: 'right' },
    { key: 'created', label: 'New in range', render: (r) => r.leadsCreatedInRange, align: 'right' },
    { key: 'won', label: 'Converted in range', render: (r) => r.convertedInRange, align: 'right' },
    { key: 'visits', label: 'Visits', render: (r) => r.visitsInRange, align: 'right' },
    { key: 'fu', label: 'Follow-ups done', render: (r) => r.followUpsCompletedInRange, align: 'right' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{isLeader ? 'Your team only.' : 'Whole organisation.'}</span>
            <span className="inline-flex items-center gap-1.5 text-slate-600"><CalendarRange className="w-4 h-4 text-slate-400" /><span data-testid="range-label">{rangeLabel}</span></span>
          </p>
        </div>
        <div className="page-actions">
          {!isLeader && (
            <select aria-label="Filter by team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className={sel}>
              <option value="">All teams</option>
              {teams?.items.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <select aria-label="Date range" value={preset} onChange={(e) => setPreset(e.target.value)} className={sel}>
            {RANGE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            <option value="custom">Custom range…</option>
          </select>
          {preset === 'custom' && (
            <>
              <input type="date" aria-label="From date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={sel} />
              <input type="date" aria-label="To date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={sel} />
            </>
          )}
        </div>
      </div>

      <div role="tablist" className="tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className="tab">
            {t.label}
          </button>
        ))}
      </div>

      {!range ? (
        <EmptyState title="Pick a valid date range" hint="Choose both dates, with the start on or before the end." />
      ) : tab === 'teams' ? (
        <Body q={teamPerf}>
          {teamPerf.data && (teamPerf.data.teams.length === 0 ? <EmptyState title="No teams to report on" /> : (
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <h2 className="card-title">New vs converted in the selected range</h2>
                  <ChartLegend items={[{ label: 'New leads', color: CHART.primary }, { label: 'Converted', color: CHART.secondary }]} />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamPerf.data.teams} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barGap={2} barCategoryGap="30%">
                      <CartesianGrid vertical={false} stroke={CHART.grid} />
                      <XAxis dataKey="name" {...axisProps} dy={6} />
                      <YAxis allowDecimals={false} {...axisProps} width={44} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
                      <Bar dataKey="leadsCreatedInRange" name="New leads" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="convertedInRange" name="Converted" fill={CHART.secondary} radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <DataTable rows={teamPerf.data.teams} columns={teamCols} rowKey={(r) => r.teamId} testId="team-report" exportName={file('team-performance')} />
              <p className="text-xs text-slate-500">Conversion = converted ÷ all leads of the team (all time). "In range" columns use the selected dates.</p>
            </div>
          ))}
        </Body>
      ) : tab === 'agents' ? (
        <Body q={agentPerf}>
          {agentPerf.data && (agentPerf.data.agents.length === 0 ? <EmptyState title="No agents in scope" /> : (
            <DataTable
              rows={agentPerf.data.agents}
              rowKey={(r) => r.agentId}
              testId="agent-report"
              exportName={file('agent-performance')}
              columns={[
                { key: 'name', label: 'Agent', render: (r) => <div><span className="cell-primary">{r.name}</span>{!r.isActive && <span className="ml-1.5 text-2xs text-slate-400">(inactive)</span>}<div className="cell-code">{r.employeeCode ?? ''}</div></div>, csv: (r) => r.name },
                { key: 'team', label: 'Team', render: (r) => r.team?.name ?? '—', csv: (r) => r.team?.name ?? '' },
                { key: 'target', label: 'Monthly target', render: (r) => r.monthlyTarget ?? '—', csv: (r) => r.monthlyTarget ?? '', align: 'right' },
                { key: 'total', label: 'Leads', render: (r) => r.totalLeads, align: 'right' },
                { key: 'open', label: 'Open', render: (r) => r.openLeads, align: 'right' },
                { key: 'converted', label: 'Converted', render: (r) => r.converted, align: 'right' },
                { key: 'rate', label: 'Conversion', render: (r) => `${r.conversionRate}%`, csv: (r) => r.conversionRate, align: 'right' },
                { key: 'won', label: 'Converted in range', render: (r) => r.convertedInRange, align: 'right' },
                { key: 'visits', label: 'Visits', render: (r) => r.visitsInRange, align: 'right' },
                { key: 'fu', label: 'Follow-ups done', render: (r) => r.followUpsCompletedInRange, align: 'right' },
                { key: 'days', label: 'Days attended', render: (r) => r.attendanceDaysInRange, align: 'right' },
              ]}
            />
          ))}
        </Body>
      ) : tab === 'attendance' ? (
        <Body q={attendance}>
          {attendance.data && (attendance.data.agents.length === 0 ? <EmptyState title="No attendance recorded in this range" hint="Attendance is recorded from the agent mobile app." /> : (
            <DataTable
              rows={attendance.data.agents}
              rowKey={(r) => r.agentId}
              testId="attendance-report"
              exportName={file('attendance-summary')}
              columns={[
                { key: 'name', label: 'Agent', render: (r) => <span className="cell-primary">{r.name}</span>, csv: (r) => r.name },
                { key: 'present', label: 'Present', render: (r) => r.present, align: 'right' },
                { key: 'half', label: 'Half day', render: (r) => r.halfDay, align: 'right' },
                { key: 'absent', label: 'Absent', render: (r) => r.absent, align: 'right' },
                { key: 'leave', label: 'On leave', render: (r) => r.onLeave, align: 'right' },
                { key: 'hours', label: 'Total hours', render: (r) => hours(r.totalWorkingMinutes), align: 'right' },
                { key: 'avg', label: 'Avg hours / day worked', render: (r) => hours(r.averageWorkingMinutes), align: 'right' },
              ]}
            />
          ))}
        </Body>
      ) : tab === 'visits' ? (
        <Body q={visits}>
          {visits.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBlock id="visit-total" label="Visits in range" value={visits.data.total} />
              </div>
              {visits.data.total === 0 ? <EmptyState title="No customer visits in this range" /> : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 card p-5">
                      <h2 className="card-title mb-4">Visits per day</h2>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={visits.data.byDay} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke={CHART.grid} />
                            <XAxis dataKey="date" {...axisProps} tick={{ ...axisProps.tick, fontSize: 10 }} dy={6} />
                            <YAxis allowDecimals={false} {...axisProps} width={44} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
                            <Bar dataKey="visits" name="Visits" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <CountList title="By outcome" counts={visits.data.byOutcome} testId="visit-outcomes" />
                  </div>
                  <DataTable rows={visits.data.byAgent} rowKey={(r) => r.agentId} testId="visit-agents" exportName={file('visits-by-agent')}
                    columns={[{ key: 'name', label: 'Agent', render: (r) => <span className="cell-primary">{r.name}</span>, csv: (r) => r.name }, { key: 'visits', label: 'Visits', render: (r) => r.visits, align: 'right' }]} />
                </>
              )}
            </div>
          )}
        </Body>
      ) : tab === 'onboarding' ? (
        <Body q={onboarding}>
          {onboarding.data && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <CountList title="Registration" counts={onboarding.data.registration} testId="onb-registration" />
                <CountList title="Documents / KYC" counts={onboarding.data.documents} testId="onb-documents" />
                <CountList title="Onboarding" counts={onboarding.data.onboarding} testId="onb-onboarding" />
              </div>
              <p className="text-xs text-slate-500">Internal CRM statuses for all leads in scope; not verified by any external platform. Not limited by the date range.</p>
            </div>
          )}
        </Body>
      ) : (
        <Body q={funnel}>
          {funnel.data && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Leads created in the selected range.</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <CountList title="By status" counts={funnel.data.byStatus} testId="funnel-status" format={(k) => LEAD_STATUS_LABELS[k as LeadStatusValue] ?? k} />
                <CountList title="By priority" counts={funnel.data.byPriority} testId="funnel-priority" format={(k) => PRIORITY_LABELS[k as PriorityValue] ?? k} />
              </div>
              {funnel.data.bySource.length === 0 ? <EmptyState title="No leads created in this range" /> : (
                <DataTable rows={funnel.data.bySource} rowKey={(r) => r.source} testId="funnel-sources" exportName={file('lead-sources')}
                  columns={[
                    { key: 'source', label: 'Source', render: (r) => <span className="cell-primary">{r.source}</span>, csv: (r) => r.source },
                    { key: 'total', label: 'Leads', render: (r) => r.total, align: 'right' },
                    { key: 'converted', label: 'Converted', render: (r) => r.converted, align: 'right' },
                    { key: 'rate', label: 'Conversion', render: (r) => `${r.conversionRate}%`, csv: (r) => r.conversionRate, align: 'right' },
                  ]} />
              )}
            </div>
          )}
        </Body>
      )}
    </div>
  );
};
