import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fieldErrors, normalizeError } from '@shared/api/errors';
import { webTokenStorage } from '@shared/auth/tokenStorage';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch } from '../../redux/hooks';
import { useChangePasswordMutation } from '../../redux/services/authApi';
import { tokenRotated } from '../../redux/slices/authSlice';
import { pushToast } from '../../redux/slices/toastSlice';
import { passwordRules } from '../staff/passwordRules';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordRules,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

type Form = z.infer<typeof schema>;

export const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const [change, { isLoading }] = useChangePasswordMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Form) => {
    setServerError(null);
    try {
      const { token: fresh } = await change({ currentPassword: v.currentPassword, newPassword: v.newPassword }).unwrap();
      // Changing the password signs out every other session; keep this one alive with the fresh token.
      const remembered = !!window.localStorage.getItem('jbconx.crm.token');
      await webTokenStorage.set(fresh, remembered);
      dispatch(tokenRotated(fresh));
      dispatch(pushToast('success', 'Password changed. Other devices were signed out.'));
      onClose();
    } catch (err) {
      const f = fieldErrors(err);
      if (f.currentPassword) setError('currentPassword', { message: f.currentPassword });
      if (f.newPassword) setError('newPassword', { message: f.newPassword });
      setServerError(normalizeError(err).message);
    }
  };

  const input = 'control w-full';

  return (
    <Modal title="Change password" onClose={onClose} busy={isLoading}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
        <InlineError message={serverError} />
        <div>
          <label htmlFor="cp-current" className="label">Current password</label>
          <input id="cp-current" type="password" autoComplete="current-password" className={input} {...register('currentPassword')} />
          {errors.currentPassword && <p className="text-xs text-rose-600 mt-1">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="cp-new" className="label">New password</label>
          <input id="cp-new" type="password" autoComplete="new-password" className={input} {...register('newPassword')} />
          <p className="text-[11px] text-slate-400 mt-1">At least 10 characters, with a letter and a digit.</p>
          {errors.newPassword && <p className="text-xs text-rose-600 mt-1">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="cp-confirm" className="label">Confirm new password</label>
          <input id="cp-confirm" type="password" autoComplete="new-password" className={input} {...register('confirm')} />
          {errors.confirm && <p className="text-xs text-rose-600 mt-1">{errors.confirm.message}</p>}
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
