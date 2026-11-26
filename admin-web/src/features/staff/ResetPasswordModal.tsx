import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2 } from 'lucide-react';
import { normalizeError } from '@shared/api/errors';
import type { User } from '@shared/types';
import { Modal } from '../../components/common/Modal';
import { InlineError } from '../../components/common/States';
import { useAppDispatch } from '../../redux/hooks';
import { useResetStaffPasswordMutation } from '../../redux/services/staffApi';
import { pushToast } from '../../redux/slices/toastSlice';
import { generatePassword, passwordRules } from './passwordRules';

const schema = z.object({ newPassword: passwordRules });

export const ResetPasswordModal: React.FC<{ staff: User; onClose: () => void }> = ({ staff, onClose }) => {
  const dispatch = useAppDispatch();
  const [reset, { isLoading }] = useResetStaffPasswordMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<{ newPassword: string }>({ resolver: zodResolver(schema), defaultValues: { newPassword: '' } });

  const onSubmit = async ({ newPassword }: { newPassword: string }) => {
    setServerError(null);
    try {
      await reset({ id: staff.id, newPassword }).unwrap();
      dispatch(pushToast('success', `Password reset for ${staff.name}. They were signed out everywhere.`));
      onClose();
    } catch (err) {
      setServerError(normalizeError(err).message);
    }
  };

  return (
    <Modal title={`Reset password — ${staff.name}`} onClose={onClose} busy={isLoading} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
        <InlineError message={serverError} />
        <div>
          <label htmlFor="rp-new" className="label">New password</label>
          <div className="flex gap-2">
            <input
              id="rp-new"
              type="text"
              autoComplete="off"
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600 font-mono"
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setValue('newPassword', generatePassword(), { shouldValidate: true })}
              className="inline-flex items-center gap-1 px-3 text-xs font-semibold text-brand-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100"
            >
              <Wand2 className="w-3.5 h-3.5" /> Generate
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">The user is signed out on every device and must use this password next.</p>
          {errors.newPassword && <p className="text-xs text-rose-600 mt-1">{errors.newPassword.message}</p>}
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Resetting…' : 'Reset password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
