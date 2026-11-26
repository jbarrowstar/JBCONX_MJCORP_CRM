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
  totalPages <= 1 ? <p className="text-[11px] text-slate-400 text-center">{total} total</p> : (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-40">Prev</button>
      <span>Page {page} of {totalPages} · {total} total</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-40">Next</button>
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
    <button type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
      className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${tab === t ? 'bg-[#274C77] text-white shadow' : 'text-slate-500'}`}>
      {label}{badge ? <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">{badge}</span> : null}
    </button>
  );

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My leads</h1>
          <p className="text-xs text-slate-500">Leads assigned to you and your follow-ups</p>
        </div>
        {settings?.operational.agentsCanCreateLeads && (
          <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-[#274C77] rounded-xl shadow">
            <Plus className="w-4 h-4" /> New lead
          </button>
        )}
      </div>

      <div role="tablist" className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
        {tabBtn('leads', 'Leads')}
        {tabBtn('followups', 'Follow-ups', summary.data?.overdue)}
      </div>

      {tab === 'leads' ? (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="search" aria-label="Search leads" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, mobile, city…" className="w-full pl-9 pr-3 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#274C77]" />
            </div>
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="text-xs bg-white border border-slate-200 rounded-xl px-2.5">
              <option value="">All</option>
              <option value="assigned,contacted,interested,meeting_scheduled">Open</option>
              {LEAD_STATUSES.filter((s) => s !== 'new').map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {leads.isLoading ? <p role="status" className="py-10 text-center text-xs text-slate-500">Loading leads…</p>
            : leads.isError ? <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-3">{errorMessage(leads.error)} <button type="button" className="underline font-bold" onClick={() => void leads.refetch()}>Retry</button></div>
            : leads.data!.items.length === 0 ? <div className="py-10 text-center text-xs text-slate-500">{debounced || status ? 'No leads match.' : 'No leads assigned to you yet.'}</div>
            : (
              <>
                <ul className={`space-y-3 transition-opacity ${leads.isFetching ? 'opacity-60' : ''}`} data-testid="lead-list">
                  {leads.data!.items.map((l) => (
                    <li key={l.id}>
                      <button type="button" data-testid="lead-card" onClick={() => setOpenLead(l.id)} className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 active:bg-slate-50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{l.customerName}</p>
                            <p className="text-[11px] font-mono text-slate-400">{l.leadCode}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1"><LeadStatusBadge status={l.status} /><PriorityBadge priority={l.priority} /></div>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{l.mobileNumber}</p>
                          <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{l.city}, {l.state} · {l.interestedService}</p>
                          {l.nextFollowUpAt && (
                            <p className={`flex items-center gap-1.5 ${l.isFollowUpOverdue ? 'text-red-600 font-semibold' : ''}`}><CalendarClock className="w-3.5 h-3.5" />{formatDateTime(l.nextFollowUpAt)}{l.isFollowUpOverdue ? ' · overdue' : ''}</p>
                          )}
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
          <div role="tablist" className="flex gap-2">
            {FU_TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={fuTab === t.id} onClick={() => setFuTab(t.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-full border ${fuTab === t.id ? 'bg-[#274C77] text-white border-[#274C77]' : 'bg-white text-slate-600 border-slate-200'}`}>
                {t.label}{t.id === 'overdue' && summary.data ? ` (${summary.data.overdue})` : ''}
              </button>
            ))}
          </div>
          {followUps.isLoading ? <p role="status" className="py-10 text-center text-xs text-slate-500">Loading follow-ups…</p>
            : followUps.isError ? <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-3">{errorMessage(followUps.error)}</div>
            : followUps.data!.items.length === 0 ? <div className="py-10 text-center text-xs text-slate-500">Nothing here.</div>
            : (
              <>
                <ul className="space-y-3" data-testid="followup-list">
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
