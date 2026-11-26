import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, X, Pencil } from 'lucide-react';
import { AuthedImage } from '@shared/components/AuthedImage';
import {
  VISIT_OUTCOMES, VISIT_OUTCOME_LABELS, VISIT_STATUSES, VISIT_STATUS_LABELS, formatCoords, mapsUrl,
  type VisitDto, type VisitOutcomeValue, type VisitStatusValue,
} from '@shared/api/fieldwork';
import { formatDateTime } from '@shared/api/crm';
import { normalizeError } from '@shared/api/errors';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { API_BASE_URL } from '../../redux/services/baseApi';
import { useListLeadDocumentsQuery, useUpdateVisitMutation } from '../../redux/services/fieldApi';
import { pushToast } from '../../redux/slices/toastSlice';

const input = 'w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]';

const EditVisitModal: React.FC<{ visit: VisitDto; onClose: () => void }> = ({ visit, onClose }) => {
  const dispatch = useAppDispatch();
  const [update, { isLoading }] = useUpdateVisitMutation();
  const [notes, setNotes] = useState(visit.notes);
  const [outcome, setOutcome] = useState<VisitOutcomeValue>(visit.outcome);
  const [status, setStatus] = useState<VisitStatusValue>(visit.status);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim().length < 3) return setError('Visit notes are required.');
    const changes: { notes?: string; outcome?: VisitOutcomeValue; status?: VisitStatusValue } = {};
    if (notes.trim() !== visit.notes) changes.notes = notes.trim();
    if (outcome !== visit.outcome) changes.outcome = outcome;
    if (status !== visit.status) changes.status = status;
    if (!Object.keys(changes).length) return onClose();
    try {
      await update({ id: visit.id, changes }).unwrap();
      dispatch(pushToast('success', 'Visit updated.'));
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };
  return (
    <Modal title="Edit visit" onClose={onClose} busy={isLoading} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <InlineError message={error} />
        <div><label htmlFor="ev-outcome" className="block text-xs font-semibold text-slate-700 mb-1">Outcome</label>
          <select id="ev-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value as VisitOutcomeValue)} className={input}>{VISIT_OUTCOMES.map((o) => <option key={o} value={o}>{VISIT_OUTCOME_LABELS[o]}</option>)}</select></div>
        <div><label htmlFor="ev-status" className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
          <select id="ev-status" value={status} onChange={(e) => setStatus(e.target.value as VisitStatusValue)} className={input}>{VISIT_STATUSES.map((o) => <option key={o} value={o}>{VISIT_STATUS_LABELS[o]}</option>)}</select></div>
        <div><label htmlFor="ev-notes" className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
          <textarea id="ev-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className={input} /></div>
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg disabled:opacity-60">{isLoading ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
};

export const VisitDrawer: React.FC<{ visit: VisitDto; onClose: () => void }> = ({ visit, onClose }) => {
  const actor = useAppSelector((s) => s.auth.user)!;
  const token = useAppSelector((s) => s.auth.token);
  const canEdit = actor.role === 'super_admin' || actor.role === 'marketing_manager';
  const [editing, setEditing] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const docs = useListLeadDocumentsQuery(visit.leadId, { skip: visit.photoCount === 0 });
  const photos = (docs.data ?? []).filter((d) => d.visitId === visit.id);
  const origin = new URL(API_BASE_URL).origin;
  const urlOf = (path: string) => `${origin}${path}`;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden />
      <aside role="dialog" aria-label="Visit details" className="relative w-full max-w-lg bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col h-full overflow-y-auto">
        <div className="bg-white border-b border-slate-200 p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-400">{formatDateTime(visit.visitedAt)}</p>
            <h2 className="text-lg font-bold text-slate-900">{visit.lead?.customerName ?? 'Customer visit'}</h2>
            <p className="text-xs text-slate-500">by {visit.agent?.name ?? '—'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close visit details" className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">{VISIT_OUTCOME_LABELS[visit.outcome]}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-600 border-slate-200">{VISIT_STATUS_LABELS[visit.status]}</span>
            {visit.location.lowAccuracy && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">Low GPS accuracy</span>}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <a href={mapsUrl(visit.location.latitude, visit.location.longitude)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-[#274C77] font-semibold hover:underline">
              <MapPin className="w-3.5 h-3.5" /> {formatCoords(visit.location.latitude, visit.location.longitude)}{visit.location.accuracy != null ? ` (±${Math.round(visit.location.accuracy)} m)` : ''}
            </a>
            {visit.lead && <p><Link to={`/admin/leads?lead=${visit.lead.id}`} className="text-[#274C77] hover:underline font-semibold">{visit.lead.leadCode}</Link> · {visit.lead.city}</p>}
            {visit.nextFollowUpAt && <p className="text-slate-600">Next follow-up: {formatDateTime(visit.nextFollowUpAt)}</p>}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Visit notes</p>
            <p className="text-xs text-slate-800 whitespace-pre-wrap">{visit.notes}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 mb-2">Photos ({visit.photoCount})</p>
            {visit.photoCount === 0 ? <p className="text-xs text-slate-400">No photos attached.</p> : docs.isLoading ? <p className="text-xs text-slate-400">Loading…</p> : (
              <div className="grid grid-cols-3 gap-2" data-testid="visit-photos">
                {photos.map((p) => (
                  <button key={p.id} type="button" onClick={() => setZoom(p.downloadPath)} aria-label={`Open photo ${p.originalName}`} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
                    <AuthedImage url={urlOf(p.downloadPath)} token={token} alt={p.originalName} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {canEdit && <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 bg-white rounded-lg hover:bg-slate-50"><Pencil className="w-3.5 h-3.5" /> Edit visit</button>}
        </div>
      </aside>
      {editing && <EditVisitModal visit={visit} onClose={() => setEditing(false)} />}
      {zoom && (
        <Modal title="Visit photo" onClose={() => setZoom(null)} size="lg">
          <div className="p-3"><AuthedImage url={urlOf(zoom)} token={token} alt="Visit photo" className="w-full max-h-[70vh] object-contain" /></div>
        </Modal>
      )}
    </div>
  );
};
