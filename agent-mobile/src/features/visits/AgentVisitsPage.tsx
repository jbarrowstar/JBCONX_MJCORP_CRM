import React, { useState } from 'react';
import { Plus, MapPin, Image as ImageIcon } from 'lucide-react';
import { AuthedImage } from '@shared/components/AuthedImage';
import { VISIT_OUTCOME_LABELS, VISIT_STATUS_LABELS, formatCoords, mapsUrl, type VisitDto } from '@shared/api/fieldwork';
import { formatDateTime } from '@shared/api/crm';
import { errorMessage } from '@shared/api/errors';
import { Sheet } from '../../components/common/Sheet';
import { useAppSelector } from '../../redux/hooks';
import { API_BASE_URL } from '../../redux/services/baseApi';
import { useListLeadDocumentsQuery, useListVisitsQuery } from '../../redux/services/fieldApi';
import { RecordVisitSheet } from './RecordVisitSheet';

const VisitSheet: React.FC<{ visit: VisitDto; onClose: () => void }> = ({ visit, onClose }) => {
  const token = useAppSelector((s) => s.auth.token);
  const docs = useListLeadDocumentsQuery(visit.leadId, { skip: visit.photoCount === 0 });
  const photos = (docs.data ?? []).filter((d) => d.visitId === visit.id);
  const origin = new URL(API_BASE_URL).origin;
  return (
    <Sheet title={visit.lead?.customerName ?? 'Visit'} onClose={onClose} tall>
      <div className="p-5 space-y-4 text-[13px] text-slate-700">
        <p className="text-slate-500">{formatDateTime(visit.visitedAt)} · {VISIT_OUTCOME_LABELS[visit.outcome]}{visit.status !== 'completed' ? ` · ${VISIT_STATUS_LABELS[visit.status]}` : ''}</p>
        <a href={mapsUrl(visit.location.latitude, visit.location.longitude)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 link"><MapPin className="w-4 h-4" />{formatCoords(visit.location.latitude, visit.location.longitude)}</a>
        <p className="whitespace-pre-wrap bg-slate-50 border border-slate-200/80 rounded-lg p-4 text-slate-800">{visit.notes}</p>
        {visit.nextFollowUpAt && <p>Next follow-up: <strong>{formatDateTime(visit.nextFollowUpAt)}</strong></p>}
        {visit.photoCount > 0 && (
          <div>
            <p className="font-semibold text-slate-900 mb-2">Photos ({visit.photoCount})</p>
            <div className="grid grid-cols-3 gap-2" data-testid="visit-photos">
              {photos.map((p) => <AuthedImage key={p.id} url={`${origin}${p.downloadPath}`} token={token} alt={p.originalName} className="w-full aspect-square object-cover rounded-lg border border-slate-200" />)}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
};

export const AgentVisitsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [recording, setRecording] = useState(false);
  const [open, setOpen] = useState<VisitDto | null>(null);
  const visits = useListVisitsQuery({ page, limit: 10 }, { refetchOnMountOrArgChange: true });

  const OUTCOME_STYLE: Record<string, string> = {
    interested: 'bg-violet-50 text-violet-700 border-violet-200',
    not_interested: 'bg-slate-100 text-slate-600 border-slate-200',
    follow_up_required: 'bg-amber-50 text-amber-800 border-amber-200',
    converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    not_available: 'bg-slate-50 text-slate-500 border-slate-200',
    other: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer visits</h1>
          <p className="page-subtitle">Record where you went and what happened</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={() => setRecording(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Record visit
          </button>
        </div>
      </div>

      {visits.isLoading ? <p role="status" className="py-12 text-center text-[13px] text-slate-500">Loading visits…</p>
        : visits.isError ? <div role="alert" className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-3">{errorMessage(visits.error)} <button type="button" className="underline font-semibold" onClick={() => void visits.refetch()}>Retry</button></div>
        : visits.data!.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 py-14 text-center">
            <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-[13px] text-slate-500">You have not recorded any visits yet.</p>
          </div>
        )
        : (
          <section className="card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="card-title">Visit log</h2>
              <span className="text-xs text-slate-500">{visits.data!.meta.total} total</span>
            </div>
            <ul className="divide-y divide-slate-100" data-testid="visit-list">
              {visits.data!.items.map((v) => (
                <li key={v.id}>
                  <button type="button" data-testid="visit-card" onClick={() => setOpen(v)} className="group w-full text-left px-5 py-4 flex gap-4 hover:bg-slate-50/70 transition-colors">
                    <span className="mt-0.5 w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0" aria-hidden><MapPin className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-slate-900 truncate group-hover:text-brand-700">{v.lead?.customerName ?? 'Customer'}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(v.visitedAt)}</p>
                        </div>
                        <span className={`badge ${OUTCOME_STYLE[v.outcome] ?? OUTCOME_STYLE.other}`}>{VISIT_OUTCOME_LABELS[v.outcome]}</span>
                      </div>
                      <p className="text-[13px] text-slate-600 mt-2 line-clamp-2">{v.notes}</p>
                      {v.photoCount > 0 && <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><ImageIcon className="w-3.5 h-3.5" />{v.photoCount} photo{v.photoCount === 1 ? '' : 's'}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {visits.data!.meta.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500 px-5 py-3 border-t border-slate-100">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">Prev</button>
                <span>Page {page} of {visits.data!.meta.totalPages}</span>
                <button type="button" disabled={page >= visits.data!.meta.totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">Next</button>
              </div>
            )}
          </section>
        )}

      {recording && <RecordVisitSheet onClose={() => setRecording(false)} />}
      {open && <VisitSheet visit={open} onClose={() => setOpen(null)} />}
    </div>
  );
};
