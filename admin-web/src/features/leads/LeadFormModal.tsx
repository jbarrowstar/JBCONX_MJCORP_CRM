import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fieldErrors, normalizeError } from '@shared/api/errors';
import { PRIORITIES, PRIORITY_LABELS, localInputToIso, type LeadDto, type PriorityValue } from '@shared/api/crm';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { useCreateLeadMutation, useGetPublicSettingsQuery, useUpdateLeadMutation } from '../../redux/services/crmApi';
import type { CreateLeadInput, UpdateLeadInput } from '../../redux/services/crmApi';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { useListTeamsQuery } from '../../redux/services/teamApi';
import { pushToast } from '../../redux/slices/toastSlice';

const schema = z.object({
  customerName: z.string().trim().min(2, 'Enter the customer name').max(120),
  mobileNumber: z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/, 'Enter a valid mobile number'),
  email: z.string().trim().refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email'),
  address: z.string().trim().max(400),
  city: z.string().trim().min(1, 'Enter the city').max(80),
  state: z.string().trim().min(1, 'Enter the state').max(80),
  leadSource: z.string().min(1, 'Choose a source'),
  interestedService: z.string().trim().min(1, 'Enter the product or service of interest').max(120),
  priority: z.enum(PRIORITIES),
  remarks: z.string().trim().max(2000),
  teamId: z.string(),
  assignedAgentId: z.string(),
  followUpAt: z.string(),
});
type Form = z.infer<typeof schema>;

interface Props {
  lead?: LeadDto;
  onClose: () => void;
  onSaved?: (lead: LeadDto) => void;
}

export const LeadFormModal: React.FC<Props> = ({ lead, onClose, onSaved }) => {
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user)!;
  const editing = !!lead;
  const [createLead, createState] = useCreateLeadMutation();
  const [updateLead, updateState] = useUpdateLeadMutation();
  const { data: settings } = useGetPublicSettingsQuery();
  const [serverError, setServerError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const busy = createState.isLoading || updateState.isLoading;

  const {
    register, handleSubmit, setError, control, watch, getValues,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: lead?.customerName ?? '', mobileNumber: lead?.mobileNumber ?? '', email: lead?.email ?? '',
      address: lead?.address ?? '', city: lead?.city ?? '', state: lead?.state ?? '', leadSource: lead?.leadSource ?? '',
      interestedService: lead?.interestedService ?? '', priority: (lead?.priority ?? 'medium') as PriorityValue,
      remarks: lead?.remarks ?? '', teamId: '', assignedAgentId: '', followUpAt: '',
    },
  });

  const teamId = watch('teamId');
  const isLeader = actor.role === 'team_leader';
  const { data: teams } = useListTeamsQuery({ limit: 100, isActive: true }, { skip: editing || isLeader });
  const { data: agents } = useListStaffQuery(
    { role: 'field_agent', isActive: true, limit: 100, sort: 'name', order: 'asc', ...(teamId && { teamId }) },
    { skip: editing }
  );

  const sources = useMemo(() => {
    const list = [...(settings?.operational.leadSources ?? [])];
    if (lead?.leadSource && !list.includes(lead.leadSource)) list.unshift(lead.leadSource);
    return list;
  }, [settings, lead]);

  const submit = async (v: Form, allowDuplicate = false) => {
    setServerError(null);
    try {
      let saved: LeadDto;
      if (!editing) {
        const input: CreateLeadInput = {
          customerName: v.customerName.trim(), mobileNumber: v.mobileNumber.trim(), city: v.city.trim(), state: v.state.trim(),
          leadSource: v.leadSource, interestedService: v.interestedService.trim(), priority: v.priority,
          ...(v.email.trim() && { email: v.email.trim() }),
          ...(v.address.trim() && { address: v.address.trim() }),
          ...(v.remarks.trim() && { remarks: v.remarks.trim() }),
          ...(v.teamId && !v.assignedAgentId && { teamId: v.teamId }),
          ...(v.assignedAgentId && { assignedAgentId: v.assignedAgentId }),
          ...(v.followUpAt && { nextFollowUpAt: localInputToIso(v.followUpAt) }),
          ...(allowDuplicate && { allowDuplicate: true }),
        };
        saved = await createLead(input).unwrap();
        dispatch(pushToast('success', `Lead ${saved.leadCode} created.`));
      } else {
        const changes: UpdateLeadInput = {};
        const cmp = <K extends keyof Form>(k: K, cur: string | null | undefined) => v[k] !== (cur ?? '');
        if (cmp('customerName', lead!.customerName)) changes.customerName = v.customerName.trim();
        if (cmp('mobileNumber', lead!.mobileNumber)) changes.mobileNumber = v.mobileNumber.trim();
        if (cmp('email', lead!.email)) changes.email = v.email.trim() || null;
        if (cmp('address', lead!.address)) changes.address = v.address.trim() || null;
        if (cmp('city', lead!.city)) changes.city = v.city.trim();
        if (cmp('state', lead!.state)) changes.state = v.state.trim();
        if (cmp('leadSource', lead!.leadSource)) changes.leadSource = v.leadSource;
        if (cmp('interestedService', lead!.interestedService)) changes.interestedService = v.interestedService.trim();
        if (v.priority !== lead!.priority) changes.priority = v.priority;
        if (cmp('remarks', lead!.remarks)) changes.remarks = v.remarks.trim() || null;
        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }
        saved = await updateLead({ id: lead!.id, changes }).unwrap();
        dispatch(pushToast('success', 'Lead updated.'));
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      const e = normalizeError(err);
      const f = fieldErrors(err);
      for (const [path, message] of Object.entries(f)) {
        if (path in schema.shape) setError(path as keyof Form, { message });
      }
      setDuplicate(!editing && e.status === 409 && /mobile/i.test(e.message));
      setServerError(e.message);
    }
  };

  const input = 'control w-full';
  const label = 'block text-xs font-semibold text-slate-700 mb-1';
  const err = (k: keyof Form) => (errors[k] ? <p className="text-xs text-rose-600 mt-1">{errors[k]?.message as string}</p> : null);

  return (
    <Modal title={editing ? `Edit ${lead!.leadCode}` : 'New lead'} onClose={onClose} busy={busy} size="lg">
      <form onSubmit={handleSubmit((v) => submit(v))} className="p-5 space-y-4" noValidate>
        <InlineError message={serverError} />
        {duplicate && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900">
            <span>This number is already on another lead. Create a separate lead anyway?</span>
            <button type="button" disabled={busy} onClick={() => void submit(getValues(), true)} className="px-3 py-1.5 font-semibold bg-amber-600 text-white rounded-lg whitespace-nowrap disabled:opacity-60">
              Create anyway
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="lf-name" className={label}>Customer name *</label>
            <input id="lf-name" className={input} {...register('customerName')} />
            {err('customerName')}
          </div>
          <div>
            <label htmlFor="lf-mobile" className={label}>Mobile number *</label>
            <input id="lf-mobile" type="tel" className={input} {...register('mobileNumber')} />
            {err('mobileNumber')}
          </div>
          <div>
            <label htmlFor="lf-email" className={label}>Email</label>
            <input id="lf-email" type="email" className={input} {...register('email')} />
            {err('email')}
          </div>
          <div>
            <label htmlFor="lf-priority" className={label}>Priority</label>
            <Controller control={control} name="priority" render={({ field }) => (
              <select id="lf-priority" className={input} {...field}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            )} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lf-address" className={label}>Address</label>
            <input id="lf-address" className={input} {...register('address')} />
          </div>
          <div>
            <label htmlFor="lf-city" className={label}>City *</label>
            <input id="lf-city" className={input} {...register('city')} />
            {err('city')}
          </div>
          <div>
            <label htmlFor="lf-state" className={label}>State *</label>
            <input id="lf-state" className={input} {...register('state')} />
            {err('state')}
          </div>
          <div>
            <label htmlFor="lf-source" className={label}>Lead source *</label>
            <Controller control={control} name="leadSource" render={({ field }) => (
              <select id="lf-source" className={input} {...field}>
                <option value="">Select a source…</option>
                {sources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )} />
            {err('leadSource')}
          </div>
          <div>
            <label htmlFor="lf-service" className={label}>Product / service of interest *</label>
            <input id="lf-service" className={input} {...register('interestedService')} />
            {err('interestedService')}
          </div>
        </div>

        <div>
          <label htmlFor="lf-remarks" className={label}>Remarks</label>
          <textarea id="lf-remarks" rows={2} className={input} {...register('remarks')} />
        </div>

        {!editing && (
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs font-bold text-slate-700">Assignment (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!isLeader && (
                <div>
                  <label htmlFor="lf-team" className={label}>Team</label>
                  <Controller control={control} name="teamId" render={({ field }) => (
                    <select id="lf-team" className={input} {...field}>
                      <option value="">No team</option>
                      {teams?.items.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )} />
                </div>
              )}
              <div>
                <label htmlFor="lf-agent" className={label}>Assign to agent</label>
                <Controller control={control} name="assignedAgentId" render={({ field }) => (
                  <select id="lf-agent" className={input} {...field}>
                    <option value="">Leave unassigned{isLeader ? ' (auto if enabled)' : ''}</option>
                    {agents?.items.map((a) => <option key={a.id} value={a.id}>{a.name}{a.team ? ` — ${a.team.name}` : ''}</option>)}
                  </select>
                )} />
              </div>
            </div>
            <div>
              <label htmlFor="lf-fu" className={label}>First follow-up (call)</label>
              <input id="lf-fu" type="datetime-local" className={input} {...register('followUpAt')} />
              <p className="text-[11px] text-slate-400 mt-1">Optional. Schedules a call reminder for the assigned agent.</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
