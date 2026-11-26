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
      <div className="p-5 space-y-4 text-xs text-slate-700">
        <p className="text-slate-500">{formatDateTime(visit.visitedAt)} · {VISIT_OUTCOME_LABELS[visit.outcome]}{visit.status !== 'completed' ? ` · ${VISIT_STATUS_LABELS[visit.status]}` : ''}</p>
        <a href={mapsUrl(visit.location.latitude, visit.location.longitude)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-[#274C77] font-bold"><MapPin className="w-4 h-4" />{formatCoords(visit.location.latitude, visit.location.longitude)}</a>
        <p className="whitespace-pre-wrap bg-slate-50 rounded-2xl p-4 text-slate-800">{visit.notes}</p>
        {visit.nextFollowUpAt && <p>Next follow-up: <strong>{formatDateTime(visit.nextFollowUpAt)}</strong></p>}
        {visit.photoCount > 0 && (
          <div>
            <p className="font-bold text-slate-800 mb-2">Photos ({visit.photoCount})</p>
            <div className="grid grid-cols-3 gap-2" data-testid="visit-photos">
              {photos.map((p) => <AuthedImage key={p.id} url={`${origin}${p.downloadPath}`} token={token} alt={p.originalName} className="w-full aspect-square object-cover rounded-xl border border-slate-200" />)}
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

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer visits</h1>
          <p className="text-xs text-slate-500">Record where you went and what happened</p>
        </div>
        <button type="button" onClick={() => setRecording(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-[#274C77] rounded-xl shadow">
          <Plus className="w-4 h-4" /> Record visit
        </button>
      </div>

      {visits.isLoading ? <p role="status" className="py-10 text-center text-xs text-slate-500">Loading visits…</p>
        : visits.isError ? <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-3">{errorMessage(visits.error)} <button type="button" className="underline font-bold" onClick={() => void visits.refetch()}>Retry</button></div>
        : visits.data!.items.length === 0 ? <div className="py-10 text-center text-xs text-slate-500">You have not recorded any visits yet.</div>
        : (
          <>
            <ul className="space-y-3" data-testid="visit-list">
              {visits.data!.items.map((v) => (
                <li key={v.id}>
                  <button type="button" data-testid="visit-card" onClick={() => setOpen(v)} className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{v.lead?.customerName ?? 'Customer'}</p><p className="text-[11px] text-slate-400">{formatDateTime(v.visitedAt)}</p></div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 whitespace-nowrap">{VISIT_OUTCOME_LABELS[v.outcome]}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{v.notes}</p>
                    {v.photoCount > 0 && <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500"><ImageIcon className="w-3.5 h-3.5" />{v.photoCount} photo{v.photoCount === 1 ? '' : 's'}</p>}
                  </button>
                </li>
              ))}
            </ul>
            {visits.data!.meta.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-40">Prev</button>
                <span>Page {page} of {visits.data!.meta.totalPages}</span>
                <button type="button" disabled={page >= visits.data!.meta.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}

      {recording && <RecordVisitSheet onClose={() => setRecording(false)} />}
      {open && <VisitSheet visit={open} onClose={() => setOpen(null)} />}
    </div>
  );
};
