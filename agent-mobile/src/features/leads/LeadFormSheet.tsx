import React, { useState } from 'react';
import { PRIORITIES, PRIORITY_LABELS, localInputToIso, type LeadDto, type PriorityValue } from '@shared/api/crm';
import { normalizeError } from '@shared/api/errors';
import { Sheet, fieldClass, labelClass } from '../../components/common/Sheet';
import { useAppDispatch } from '../../redux/hooks';
import { useCreateLeadMutation, useGetPublicSettingsQuery, useUpdateLeadMutation } from '../../redux/services/crmApi';
import type { UpdateLeadInput } from '../../redux/services/crmApi';
import { pushToast } from '../../redux/slices/toastSlice';

interface Values {
  customerName: string; mobileNumber: string; email: string; address: string; city: string; state: string;
  leadSource: string; interestedService: string; priority: PriorityValue; remarks: string; followUpAt: string;
}

const validate = (v: Values, editing: boolean): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!editing) {
    if (v.customerName.trim().length < 2) e.customerName = 'Enter the customer name';
    if (!/^\+?[0-9 ()-]{8,20}$/.test(v.mobileNumber.trim())) e.mobileNumber = 'Enter a valid mobile number';
    if (!v.leadSource) e.leadSource = 'Choose a source';
  }
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email';
  if (!v.city.trim()) e.city = 'Enter the city';
  if (!v.state.trim()) e.state = 'Enter the state';
  if (!v.interestedService.trim()) e.interestedService = 'Enter the product or service';
  return e;
};

/** Create a lead (assigned to the agent automatically by the server) or edit the fields an agent may change. */
export const LeadFormSheet: React.FC<{ lead?: LeadDto; onClose: () => void; onSaved?: (l: LeadDto) => void }> = ({ lead, onClose, onSaved }) => {
  const dispatch = useAppDispatch();
  const editing = !!lead;
  const { data: settings } = useGetPublicSettingsQuery();
  const [create, c] = useCreateLeadMutation();
  const [update, u] = useUpdateLeadMutation();
  const busy = c.isLoading || u.isLoading;
  const [v, setV] = useState<Values>({
    customerName: lead?.customerName ?? '', mobileNumber: lead?.mobileNumber ?? '', email: lead?.email ?? '', address: lead?.address ?? '',
    city: lead?.city ?? '', state: lead?.state ?? '', leadSource: lead?.leadSource ?? '', interestedService: lead?.interestedService ?? '',
    priority: lead?.priority ?? 'medium', remarks: lead?.remarks ?? '', followUpAt: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((cur) => ({ ...cur, [k]: val }));
  const sources = [...(settings?.operational.leadSources ?? [])];
  if (lead?.leadSource && !sources.includes(lead.leadSource)) sources.unshift(lead.leadSource);

  const save = async (allowDuplicate = false) => {
    setServerError(null);
    const errs = validate(v, editing);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      let saved: LeadDto;
      if (!editing) {
        saved = await create({
          customerName: v.customerName.trim(), mobileNumber: v.mobileNumber.trim(), city: v.city.trim(), state: v.state.trim(),
          leadSource: v.leadSource, interestedService: v.interestedService.trim(), priority: v.priority,
          ...(v.email.trim() && { email: v.email.trim() }), ...(v.address.trim() && { address: v.address.trim() }),
          ...(v.remarks.trim() && { remarks: v.remarks.trim() }), ...(v.followUpAt && { nextFollowUpAt: localInputToIso(v.followUpAt) }),
          ...(allowDuplicate && { allowDuplicate: true }),
        }).unwrap();
        dispatch(pushToast('success', `Lead ${saved.leadCode} created.`));
      } else {
        const changes: UpdateLeadInput = {};
        if (v.email.trim() !== (lead!.email ?? '')) changes.email = v.email.trim() || null;
        if (v.address.trim() !== (lead!.address ?? '')) changes.address = v.address.trim() || null;
        if (v.city.trim() !== lead!.city) changes.city = v.city.trim();
        if (v.state.trim() !== lead!.state) changes.state = v.state.trim();
        if (v.interestedService.trim() !== lead!.interestedService) changes.interestedService = v.interestedService.trim();
        if (v.remarks.trim() !== (lead!.remarks ?? '')) changes.remarks = v.remarks.trim() || null;
        if (!Object.keys(changes).length) return onClose();
        saved = await update({ id: lead!.id, changes }).unwrap();
        dispatch(pushToast('success', 'Lead updated.'));
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      const e = normalizeError(err);
      setDuplicate(!editing && e.status === 409 && /mobile/i.test(e.message));
      setServerError(e.message);
    }
  };

  const fe = (k: string) => (errors[k] ? <p className="text-xs text-rose-600 mt-1">{errors[k]}</p> : null);

  return (
    <Sheet title={editing ? `Edit ${lead!.leadCode}` : 'New lead'} onClose={onClose} busy={busy} tall>
      <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="p-5 space-y-4" noValidate>
        {serverError && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{serverError}</div>}
        {duplicate && (
          <button type="button" disabled={busy} onClick={() => void save(true)} className="btn btn-lg w-full text-white bg-amber-600 hover:bg-amber-700">
            Create anyway (duplicate number)
          </button>
        )}
        {!editing && (
          <>
            <div>
              <label htmlFor="m-lf-name" className={labelClass}>Customer name *</label>
              <input id="m-lf-name" className={fieldClass} value={v.customerName} onChange={(e) => set('customerName', e.target.value)} />
              {fe('customerName')}
            </div>
            <div>
              <label htmlFor="m-lf-mobile" className={labelClass}>Mobile number *</label>
              <input id="m-lf-mobile" type="tel" className={fieldClass} value={v.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} />
              {fe('mobileNumber')}
            </div>
          </>
        )}
        <div>
          <label htmlFor="m-lf-email" className={labelClass}>Email</label>
          <input id="m-lf-email" type="email" className={fieldClass} value={v.email} onChange={(e) => set('email', e.target.value)} />
          {fe('email')}
        </div>
        <div>
          <label htmlFor="m-lf-address" className={labelClass}>Address</label>
          <input id="m-lf-address" className={fieldClass} value={v.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="m-lf-city" className={labelClass}>City *</label>
            <input id="m-lf-city" className={fieldClass} value={v.city} onChange={(e) => set('city', e.target.value)} />
            {fe('city')}
          </div>
          <div>
            <label htmlFor="m-lf-state" className={labelClass}>State *</label>
            <input id="m-lf-state" className={fieldClass} value={v.state} onChange={(e) => set('state', e.target.value)} />
            {fe('state')}
          </div>
        </div>
        {!editing && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="m-lf-source" className={labelClass}>Source *</label>
              <select id="m-lf-source" className={fieldClass} value={v.leadSource} onChange={(e) => set('leadSource', e.target.value)}>
                <option value="">Select…</option>
                {sources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {fe('leadSource')}
            </div>
            <div>
              <label htmlFor="m-lf-priority" className={labelClass}>Priority</label>
              <select id="m-lf-priority" className={fieldClass} value={v.priority} onChange={(e) => set('priority', e.target.value as PriorityValue)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
          </div>
        )}
        <div>
          <label htmlFor="m-lf-service" className={labelClass}>Product / service of interest *</label>
          <input id="m-lf-service" className={fieldClass} value={v.interestedService} onChange={(e) => set('interestedService', e.target.value)} />
          {fe('interestedService')}
        </div>
        <div>
          <label htmlFor="m-lf-remarks" className={labelClass}>Remarks</label>
          <textarea id="m-lf-remarks" rows={2} className={fieldClass} value={v.remarks} onChange={(e) => set('remarks', e.target.value)} />
        </div>
        {!editing && (
          <div>
            <label htmlFor="m-lf-fu" className={labelClass}>First follow-up (call)</label>
            <input id="m-lf-fu" type="datetime-local" className={fieldClass} value={v.followUpAt} onChange={(e) => set('followUpAt', e.target.value)} />
          </div>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Create lead'}
        </button>
      </form>
    </Sheet>
  );
};
