import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, Loader2, RefreshCw } from 'lucide-react';
import { VISIT_OUTCOMES, VISIT_OUTCOME_LABELS, formatCoords, type VisitDto, type VisitOutcomeValue } from '@shared/api/fieldwork';
import { localInputToIso } from '@shared/api/crm';
import { normalizeError } from '@shared/api/errors';
import { Sheet, fieldClass, labelClass } from '../../components/common/Sheet';
import { getCurrentLocation } from '../../device/geolocation';
import type { LocationResult } from '../../device/geolocation';
import { useAppDispatch } from '../../redux/hooks';
import { useListLeadsQuery } from '../../redux/services/crmApi';
import { useCreateVisitMutation, useUploadVisitPhotosMutation } from '../../redux/services/fieldApi';
import { pushToast } from '../../redux/slices/toastSlice';
import { PhotoPicker } from './PhotoPicker';

export const RecordVisitSheet: React.FC<{ onClose: () => void; initialLeadId?: string }> = ({ onClose, initialLeadId }) => {
  const dispatch = useAppDispatch();
  const [create, c] = useCreateVisitMutation();
  const [upload, u] = useUploadVisitPhotosMutation();
  const { data: leads } = useListLeadsQuery({ limit: 100, sort: 'customerName', order: 'asc', status: 'assigned,contacted,interested,meeting_scheduled,converted' });

  const [leadId, setLeadId] = useState(initialLeadId ?? '');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<VisitOutcomeValue>('interested');
  const [followUpAt, setFollowUpAt] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loc, setLoc] = useState<LocationResult | 'locating'>('locating');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedVisit, setSavedVisit] = useState<VisitDto | null>(null); // visit exists but photo upload failed
  const busy = c.isLoading || u.isLoading;

  const locate = useCallback(async () => {
    setLoc('locating');
    setLoc(await getCurrentLocation());
  }, []);
  useEffect(() => { void locate(); }, [locate]);

  const finish = (visit: VisitDto) => {
    dispatch(pushToast('success', 'Visit recorded.'));
    onClose();
    void visit;
  };

  const uploadPhotos = async (visit: VisitDto) => {
    try {
      await upload({ id: visit.id, files: photos }).unwrap();
      finish(visit);
    } catch (err) {
      setSavedVisit(visit);
      setServerError(`The visit was saved, but the photos could not be uploaded: ${normalizeError(err).message}`);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (savedVisit) return void uploadPhotos(savedVisit);
    const errs: Record<string, string> = {};
    if (!leadId) errs.leadId = 'Choose the customer you visited';
    if (notes.trim().length < 3) errs.notes = 'Add visit notes';
    if (loc === 'locating' || !loc.ok) errs.location = 'A GPS location is required to record a visit';
    setErrors(errs);
    if (Object.keys(errs).length || loc === 'locating' || !loc.ok) return;
    try {
      const visit = await create({
        leadId, latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy, notes: notes.trim(), outcome,
        ...(followUpAt && { nextFollowUpAt: localInputToIso(followUpAt) }),
      }).unwrap();
      if (photos.length) await uploadPhotos(visit);
      else finish(visit);
    } catch (err) {
      setServerError(normalizeError(err).message);
    }
  };

  const fe = (k: string) => (errors[k] ? <p className="text-[11px] text-rose-600 mt-1">{errors[k]}</p> : null);

  return (
    <Sheet title="Record visit" onClose={onClose} busy={busy} tall>
      <form onSubmit={submit} className="p-5 space-y-4" noValidate>
        {serverError && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{serverError}</div>}

        <div className={`rounded-2xl border p-3 text-xs ${loc !== 'locating' && loc.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`} data-testid="location-card">
          {loc === 'locating' ? (
            <p className="flex items-center gap-2 text-slate-600"><Loader2 className="w-4 h-4 animate-spin" /> Finding your location…</p>
          ) : loc.ok ? (
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-emerald-800"><MapPin className="w-4 h-4" /><span data-testid="location-ok">{formatCoords(loc.latitude, loc.longitude)} (±{Math.round(loc.accuracy)} m)</span></p>
              <button type="button" onClick={() => void locate()} aria-label="Refresh location" className="p-1.5 text-emerald-700"><RefreshCw className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="space-y-2">
              <p role="alert" className="text-rose-700" data-testid="location-error">{loc.message}</p>
              <button type="button" onClick={() => void locate()} className="px-3 py-1.5 font-bold text-[#274C77] bg-white border border-slate-200 rounded-lg">Try again</button>
            </div>
          )}
          {fe('location')}
        </div>

        <div>
          <label htmlFor="m-rv-lead" className={labelClass}>Customer *</label>
          <select id="m-rv-lead" value={leadId} onChange={(e) => setLeadId(e.target.value)} className={fieldClass}>
            <option value="">Select a lead…</option>
            {leads?.items.map((l) => <option key={l.id} value={l.id}>{l.customerName} — {l.leadCode} ({l.city})</option>)}
          </select>
          {fe('leadId')}
        </div>
        <div>
          <label htmlFor="m-rv-outcome" className={labelClass}>Outcome *</label>
          <select id="m-rv-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value as VisitOutcomeValue)} className={fieldClass}>
            {VISIT_OUTCOMES.map((o) => <option key={o} value={o}>{VISIT_OUTCOME_LABELS[o]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="m-rv-notes" className={labelClass}>Visit notes *</label>
          <textarea id="m-rv-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} placeholder="What happened? What did the customer say?" />
          {fe('notes')}
        </div>
        <div>
          <label htmlFor="m-rv-fu" className={labelClass}>Next follow-up (optional)</label>
          <input id="m-rv-fu" type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} className={fieldClass} />
        </div>
        {!savedVisit && <PhotoPicker files={photos} onChange={setPhotos} />}

        <button type="submit" disabled={busy} className="w-full py-3.5 text-xs font-bold text-white bg-[#274C77] rounded-xl disabled:opacity-60">
          {busy ? (u.isLoading ? 'Uploading photos…' : 'Saving…') : savedVisit ? 'Retry photo upload' : 'Save visit'}
        </button>
        {savedVisit && <button type="button" onClick={() => finish(savedVisit)} className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">Skip photos and finish</button>}
      </form>
    </Sheet>
  );
};
