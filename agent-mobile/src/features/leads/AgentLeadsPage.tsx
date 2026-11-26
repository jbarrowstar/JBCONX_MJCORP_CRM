import React, { useEffect, useState } from 'react';
import { Search, Plus, Phone, MapPin, CalendarClock } from 'lucide-react';
import { LeadStatusBadge, PriorityBadge } from '@shared/components/LeadBadges';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, formatDateTime } from '@shared/api/crm';
import { errorMessage } from '@shared/api/errors';
import { useDebounced } from '../../hooks/useDebounced';
import {
  useFollowUpSummaryQuery, useGetPublicSettingsQuery, useListFollowUpsQuery, useListLeadsQuery,
} from '../../redux/services/crmApi';
import type { FollowUpQuery } from '../../redux/services/crmApi';
import { FollowUpCard } from './FollowUpCards';
import { LeadFormSheet } from './LeadFormSheet';
import { LeadSheet } from './LeadSheet';

type Tab = 'leads' | 'followups';
type FuTab = 'overdue' | 'upcoming' | 'completed';
const FU_TABS: { id: FuTab; label: string; status: NonNullable<FollowUpQuery['status']>; order: 'asc' | 'desc' }[] = [
  { id: 'overdue', label: 'Overdue', status: 'overdue', order: 'asc' },
  { id: 'upcoming', label: 'Upcoming', status: 'pending', order: 'asc' },
  { id: 'completed', label: 'Done', status: 'completed', order: 'desc' },
];

const Pager: React.FC<{ page: number; totalPages: number; total: number; onPage: (p: number) => void }> = ({ page, totalPages, total, onPage }) =>
  totalPages <= 1 ? <p className="text-xs text-slate-500 text-center">{total} total</p> : (
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn btn-secondary btn-sm">Prev</button>
      <span>Page {page} of {totalPages} · {total} total</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="btn btn-secondary btn-sm">Next</button>
    </div>
  );

export const AgentLeadsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('leads');
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounced(search.trim());
  const [fuTab, setFuTab] = useState<FuTab>('overdue');
  const [fuPage, setFuPage] = useState(1);
  const fu = FU_TABS.find((t) => t.id === fuTab)!;

  useEffect(() => setPage(1), [debounced, status]);
  useEffect(() => setFuPage(1), [fuTab]);

  const { data: settings } = useGetPublicSettingsQuery();
  const leads = useListLeadsQuery({ page, limit: 10, sort: 'updatedAt', order: 'desc', ...(debounced && { search: debounced }), ...(status && { status }) });
  const summary = useFollowUpSummaryQuery();
  const followUps = useListFollowUpsQuery({ page: fuPage, limit: 10, status: fu.status, order: fu.order }, { skip: tab !== 'followups' });

  const tabBtn = (t: Tab, label: string, badge?: number) => (
    <button type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="tab">
      {label}{badge ? <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-rose-600 text-white text-2xs font-semibold">{badge}</span> : null}
    </button>
  );
  const notice = (text: string) => <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 py-12 text-center text-[13px] text-slate-500">{text}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My leads</h1>
          <p className="page-subtitle">Leads assigned to you and your follow-ups</p>
        </div>
        {settings?.operational.agentsCanCreateLeads && (
          <div className="page-actions">
            <button type="button" onClick={() => setCreating(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" /> New lead
            </button>
          </div>
        )}
      </div>

      <div role="tablist" className="tabs">
        {tabBtn('leads', 'Leads')}
        {tabBtn('followups', 'Follow-ups', summary.data?.overdue)}
      </div>

      {tab === 'leads' ? (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="control-icon" />
              <input type="search" aria-label="Search leads" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, mobile, city…" className="control w-full h-10 pl-9 text-sm" />
            </div>
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="control h-10 sm:w-48">
              <option value="">All</option>
              <option value="assigned,contacted,interested,meeting_scheduled">Open</option>
              {LEAD_STATUSES.filter((s) => s !== 'new').map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {leads.isLoading ? <p role="status" className="py-12 text-center text-[13px] text-slate-500">Loading leads…</p>
            : leads.isError ? <div role="alert" className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-3">{errorMessage(leads.error)} <button type="button" className="underline font-semibold" onClick={() => void leads.refetch()}>Retry</button></div>
            : leads.data!.items.length === 0 ? notice(debounced || status ? 'No leads match.' : 'No leads assigned to you yet.')
            : (
              <>
                <ul className={`grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 transition-opacity ${leads.isFetching ? 'opacity-60' : ''}`} data-testid="lead-list">
                  {leads.data!.items.map((l) => (
                    <li key={l.id}>
                      <button type="button" data-testid="lead-card" onClick={() => setOpenLead(l.id)} className={`group w-full h-full text-left card p-4 transition-all hover:border-slate-300 hover:shadow-raised active:bg-slate-50 ${l.isFollowUpOverdue ? 'border-l-4 !border-l-rose-500' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="avatar w-9 h-9 text-xs">{l.customerName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</span>
                            <div className="min-w-0">
                              <p className="text-[15px] font-semibold text-slate-900 truncate group-hover:text-brand-700">{l.customerName}</p>
                              <p className="cell-code">{l.leadCode}</p>
                            </div>
                          </div>
                          <LeadStatusBadge status={l.status} />
                        </div>
                        <div className="mt-3 space-y-1.5 text-[13px] text-slate-600">
                          <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" />{l.mobileNumber}</p>
                          <p className="flex items-center gap-2 min-w-0"><MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" /><span className="truncate">{l.city}, {l.state} · {l.interestedService}</span></p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <PriorityBadge priority={l.priority} />
                          {l.nextFollowUpAt ? (
                            <p className={`flex items-center gap-1.5 text-xs ${l.isFollowUpOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'}`}><CalendarClock className="w-3.5 h-3.5" />{formatDateTime(l.nextFollowUpAt)}{l.isFollowUpOverdue ? ' · overdue' : ''}</p>
                          ) : <span className="text-xs text-slate-400">No follow-up</span>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                <Pager page={leads.data!.meta.page} totalPages={leads.data!.meta.totalPages} total={leads.data!.meta.total} onPage={setPage} />
              </>
            )}
        </>
      ) : (
        <>
          <div role="tablist" className="segmented self-start">
            {FU_TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={fuTab === t.id} onClick={() => setFuTab(t.id)}>
                {t.label}{t.id === 'overdue' && summary.data ? ` (${summary.data.overdue})` : ''}
              </button>
            ))}
          </div>
          {followUps.isLoading ? <p role="status" className="py-12 text-center text-[13px] text-slate-500">Loading follow-ups…</p>
            : followUps.isError ? <div role="alert" className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-3">{errorMessage(followUps.error)}</div>
            : followUps.data!.items.length === 0 ? notice('Nothing here.')
            : (
              <>
                <ul className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4" data-testid="followup-list">
                  {followUps.data!.items.map((f) => <FollowUpCard key={f.id} f={f} showLead onOpenLead={setOpenLead} />)}
                </ul>
                <Pager page={followUps.data!.meta.page} totalPages={followUps.data!.meta.totalPages} total={followUps.data!.meta.total} onPage={setFuPage} />
              </>
            )}
        </>
      )}

      {creating && <LeadFormSheet onClose={() => setCreating(false)} onSaved={(l) => setOpenLead(l.id)} />}
      {openLead && <LeadSheet leadId={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  );
};
