import React, { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Wand2 } from 'lucide-react';
import { fieldErrors, normalizeError } from '@shared/api/errors';
import { creatableRoles, ROLE_LABELS } from '@shared/auth/roles';
import type { User, UserRole } from '@shared/types';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { useCreateStaffMutation, useUpdateStaffMutation } from '../../redux/services/staffApi';
import type { CreateStaffInput, UpdateStaffInput } from '../../redux/services/staffApi';
import { useListTeamsQuery } from '../../redux/services/teamApi';
import { pushToast } from '../../redux/slices/toastSlice';
import { generatePassword, passwordRules } from './passwordRules';

const base = {
  name: z.string().trim().min(2, 'Enter the full name').max(100),
  email: z.string().trim().min(1, 'Enter an email').email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\+?[0-9 ()-]{7,20}$/.test(v), 'Enter a valid phone number'),
  role: z.enum(['marketing_manager', 'team_leader', 'field_agent', 'super_admin']),
  teamId: z.string(),
  joiningDate: z.string(),
  target: z.string().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) <= 100000), 'Enter a whole number'),
};

const createSchema = z.object({ ...base, password: passwordRules });
const editSchema = z.object({ ...base, password: z.string().optional() });

type FormValues = z.infer<typeof createSchema>;

interface Props {
  /** When set the modal edits this account, otherwise it creates one. */
  staff?: User;
  onClose: () => void;
}

export const StaffFormModal: React.FC<Props> = ({ staff, onClose }) => {
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user)!;
  const editing = !!staff;
  const roles = useMemo(() => creatableRoles(actor.role), [actor.role]);
  const [createStaff, createState] = useCreateStaffMutation();
  const [updateStaff, updateState] = useUpdateStaffMutation();
  const { data: teams } = useListTeamsQuery({ limit: 100, isActive: true });
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const busy = createState.isLoading || updateState.isLoading;

  const isSuperAdminTarget = staff?.role === 'super_admin';
  const editingSelf = staff?.id === actor.id;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editing ? (editSchema as unknown as typeof createSchema) : createSchema),
    defaultValues: {
      name: staff?.name ?? '',
      email: staff?.email ?? '',
      password: '',
      role: (staff?.role ?? 'field_agent') as FormValues['role'],
      phone: staff?.phone ?? '',
      teamId: staff?.teamId ?? '',
      joiningDate: staff?.joiningDate ? staff.joiningDate.slice(0, 10) : '',
      target: staff?.targetLeadsMonthly != null ? String(staff.targetLeadsMonthly) : '',
    },
  });

  const role = useWatch({ control, name: 'role' }) as UserRole;
  const roleLocked = editing && (isSuperAdminTarget || editingSelf);

  const onSubmit = async (v: FormValues) => {
    setServerError(null);
    const target = v.target === '' ? undefined : Number(v.target);
    try {
      if (!editing) {
        const input: CreateStaffInput = {
          name: v.name.trim(),
          email: v.email.trim(),
          password: v.password,
          role: v.role as CreateStaffInput['role'],
          ...(v.phone.trim() && { phone: v.phone.trim() }),
          ...(v.role === 'field_agent' && v.teamId && { teamId: v.teamId }),
          ...(v.joiningDate && { joiningDate: v.joiningDate }),
          ...(v.role === 'field_agent' && target !== undefined && { targetLeadsMonthly: target }),
        };
        await createStaff(input).unwrap();
        dispatch(pushToast('success', `${ROLE_LABELS[v.role]} ${v.name.trim()} created.`));
      } else {
        const changes: UpdateStaffInput = {};
        if (v.name.trim() !== staff!.name) changes.name = v.name.trim();
        if (v.email.trim().toLowerCase() !== staff!.email) changes.email = v.email.trim();
        const phone = v.phone.trim();
        if (phone !== (staff!.phone ?? '')) changes.phone = phone === '' ? null : phone;
        if (!roleLocked && v.role !== staff!.role) changes.role = v.role as UpdateStaffInput['role'];
        if (!isSuperAdminTarget && v.role === 'field_agent') {
          if (v.teamId !== (staff!.teamId ?? '')) changes.teamId = v.teamId === '' ? null : v.teamId;
          const cur = staff!.targetLeadsMonthly ?? undefined;
          if (target !== cur) changes.targetLeadsMonthly = target ?? null;
        }
        const joined = v.joiningDate;
        if (joined !== (staff!.joiningDate ? staff!.joiningDate.slice(0, 10) : '')) changes.joiningDate = joined === '' ? null : joined;

        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }
        await updateStaff({ id: staff!.id, changes }).unwrap();
        dispatch(pushToast('success', 'Changes saved.'));
      }
      onClose();
    } catch (err) {
      const f = fieldErrors(err);
      const map: Record<string, keyof FormValues> = { targetLeadsMonthly: 'target' };
      for (const [path, message] of Object.entries(f)) {
        const key = (map[path] ?? path) as keyof FormValues;
        if (key in base || key === 'password') setError(key, { message });
      }
      setServerError(normalizeError(err).message);
    }
  };

  const input = 'control w-full';
  const label = 'block text-xs font-semibold text-slate-700 mb-1';
  const err = (k: keyof FormValues) => (errors[k] ? <p className="text-xs text-rose-600 mt-1">{errors[k]?.message as string}</p> : null);

  return (
    <Modal title={editing ? `Edit ${staff!.name}` : 'Add staff member'} onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
        <InlineError message={serverError} />

        <div>
          <label htmlFor="sf-name" className={label}>Full name *</label>
          <input id="sf-name" className={input} {...register('name')} />
          {err('name')}
        </div>

        <div>
          <label htmlFor="sf-email" className={label}>Work email *</label>
          <input id="sf-email" type="email" className={input} {...register('email')} />
          {err('email')}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sf-phone" className={label}>Phone</label>
            <input id="sf-phone" type="tel" placeholder="+91 98765 43210" className={input} {...register('phone')} />
            {err('phone')}
          </div>
          <div>
            <label htmlFor="sf-role" className={label}>Role *</label>
            {roleLocked ? (
              <input id="sf-role" disabled className={input} value={ROLE_LABELS[staff!.role]} readOnly />
            ) : (
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  // Controlled on purpose: an uncontrolled <select> can show a different option than the form holds.
                  <select id="sf-role" className={input} {...field}>
                    {roles.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                )}
              />
            )}
          </div>
        </div>

        {!editing && (
          <div>
            <label htmlFor="sf-password" className={label}>Initial password *</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input id="sf-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`${input} pr-9`} {...register('password')} />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValue('password', generatePassword(), { shouldValidate: true });
                  setShowPassword(true);
                }}
                className="inline-flex items-center gap-1 px-3 text-xs font-semibold text-brand-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100"
              >
                <Wand2 className="w-3.5 h-3.5" /> Generate
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">At least 10 characters with a letter and a digit. Share it securely; the user can change it after signing in.</p>
            {err('password')}
          </div>
        )}

        {role === 'field_agent' && !isSuperAdminTarget && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sf-team" className={label}>Team</label>
              <Controller
                control={control}
                name="teamId"
                render={({ field }) => (
                  // Controlled: the teams list loads asynchronously, so the saved team must be re-selected when options arrive.
                  <select id="sf-team" className={input} {...field}>
                    <option value="">No team yet</option>
                    {teams?.items.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              />
            </div>
            <div>
              <label htmlFor="sf-target" className={label}>Monthly lead target</label>
              <input id="sf-target" inputMode="numeric" className={input} {...register('target')} />
              {err('target')}
            </div>
          </div>
        )}
        {role === 'team_leader' && !isSuperAdminTarget && (
          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            Team leaders are attached to a team from <strong>Team Management</strong>.
          </p>
        )}

        <div>
          <label htmlFor="sf-joined" className={label}>Joining date</label>
          <input id="sf-joined" type="date" className={input} {...register('joiningDate')} />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
