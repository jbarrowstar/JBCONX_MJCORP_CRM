import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fieldErrors, normalizeError } from '@shared/api/errors';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch } from '../../redux/hooks';
import { useListStaffQuery } from '../../redux/services/staffApi';
import { useCreateTeamMutation, useUpdateTeamMutation } from '../../redux/services/teamApi';
import type { Team } from '../../redux/services/teamApi';
import { pushToast } from '../../redux/slices/toastSlice';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter a team name (2+ characters)').max(100),
  description: z.string().trim().max(500),
  leaderId: z.string(),
  isActive: z.boolean(),
});
type Form = z.infer<typeof schema>;

export const TeamFormModal: React.FC<{ team?: Team; onClose: () => void }> = ({ team, onClose }) => {
  const dispatch = useAppDispatch();
  const editing = !!team;
  const [createTeam, createState] = useCreateTeamMutation();
  const [updateTeam, updateState] = useUpdateTeamMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const busy = createState.isLoading || updateState.isLoading;

  // Leaders who are not attached to a team yet (the current leader of this team is always selectable).
  const { data: free } = useListStaffQuery({ role: 'team_leader', unassigned: true, isActive: true, limit: 100, sort: 'name', order: 'asc' });
  const leaders = useMemo(() => {
    const list = [...(free?.items ?? [])];
    if (team?.leader && !list.some((l) => l.id === team.leader!.id)) {
      list.unshift({ id: team.leader.id, name: team.leader.name, email: team.leader.email } as (typeof list)[number]);
    }
    return list;
  }, [free, team]);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: team?.name ?? '', description: team?.description ?? '', leaderId: team?.leaderId ?? '', isActive: team?.isActive ?? true },
  });

  const onSubmit = async (v: Form) => {
    setServerError(null);
    try {
      if (!editing) {
        await createTeam({
          name: v.name.trim(),
          ...(v.description.trim() && { description: v.description.trim() }),
          ...(v.leaderId && { leaderId: v.leaderId }),
        }).unwrap();
        dispatch(pushToast('success', `Team "${v.name.trim()}" created.`));
      } else {
        const changes: Parameters<typeof updateTeam>[0]['changes'] = {};
        if (v.name.trim() !== team!.name) changes.name = v.name.trim();
        if (v.description.trim() !== (team!.description ?? '')) changes.description = v.description.trim() || null;
        if (v.leaderId !== (team!.leaderId ?? '')) changes.leaderId = v.leaderId || null;
        if (v.isActive !== team!.isActive) changes.isActive = v.isActive;
        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }
        await updateTeam({ id: team!.id, changes }).unwrap();
        dispatch(pushToast('success', 'Team updated.'));
      }
      onClose();
    } catch (err) {
      const f = fieldErrors(err);
      if (f.name) setError('name', { message: f.name });
      if (f.leaderId) setError('leaderId', { message: f.leaderId });
      setServerError(normalizeError(err).message);
    }
  };

  const input = 'w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]';
  const label = 'block text-xs font-semibold text-slate-700 mb-1';

  return (
    <Modal title={editing ? `Edit ${team!.name}` : 'Create team'} onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
        <InlineError message={serverError} />
        <div>
          <label htmlFor="tf-name" className={label}>Team name *</label>
          <input id="tf-name" className={input} placeholder="e.g. Bengaluru North" {...register('name')} />
          {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="tf-desc" className={label}>Description</label>
          <textarea id="tf-desc" rows={2} className={input} {...register('description')} />
        </div>
        <div>
          <label htmlFor="tf-leader" className={label}>Team leader</label>
          <Controller
            control={control}
            name="leaderId"
            render={({ field }) => (
              <select id="tf-leader" className={input} {...field}>
                <option value="">No leader yet</option>
                {leaders.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
                ))}
              </select>
            )}
          />
          <p className="text-[11px] text-slate-400 mt-1">Only team leaders who do not lead another team are listed. Create leaders under Staff Management first.</p>
          {errors.leaderId && <p className="text-[11px] text-rose-600 mt-1">{errors.leaderId.message}</p>}
        </div>
        {editing && (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300" {...register('isActive')} /> Team is active
          </label>
        )}
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-lg shadow-sm disabled:opacity-60">
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create team'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
