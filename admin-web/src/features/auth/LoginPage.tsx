import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { JBConXLogo } from '@shared/components/JBConXLogo';
import { fieldErrors, normalizeError } from '@shared/api/errors';
import { isAdminWebRole } from '@shared/auth/roles';
import { webTokenStorage } from '@shared/auth/tokenStorage';
import { useAppDispatch } from '../../redux/hooks';
import { API_BASE_URL } from '../../redux/services/baseApi';
import { useLoginMutation } from '../../redux/services/authApi';
import { setCredentials } from '../../redux/slices/authSlice';
import { InlineError } from '../../components/common/States';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your work email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const result = await login({ email: data.email, password: data.password }).unwrap();

      if (!isAdminWebRole(result.user.role)) {
        // Field agents work in the mobile app. Revoke the token we just received instead of leaving it alive.
        void fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${result.token}` } }).catch(() => undefined);
        setServerError('This account is for the Field Agent mobile app. Please sign in there.');
        return;
      }

      await webTokenStorage.set(result.token, !!data.rememberMe);
      dispatch(setCredentials({ user: result.user, token: result.token }));
    } catch (err) {
      const fields = fieldErrors(err);
      if (fields.email) setError('email', { message: fields.email });
      if (fields.password) setError('password', { message: fields.password });
      const e = normalizeError(err);
      setServerError(
        e.code === 'AUTH_INVALID_CREDENTIALS'
          ? 'Incorrect email or password.'
          : e.code === 'ACCOUNT_LOCKED'
            ? 'Too many failed attempts. Please wait a few minutes and try again.'
            : e.code === 'RATE_LIMITED'
              ? 'Too many requests. Please wait a moment and try again.'
              : e.message
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1E36] via-[#1B3B6F] to-[#274C77] flex flex-col justify-center items-center p-4 selection:bg-[#6096BA] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-[#274C77] p-8 text-center text-white relative flex flex-col items-center justify-center">
          <div className="mb-2">
            <JBConXLogo size="lg" variant="light" />
          </div>
          <p className="text-white/80 text-xs mt-1 font-medium tracking-wide">Marketing & Field Sales CRM</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Sign in to your workspace</h1>
            <p className="text-xs text-slate-500 mt-1">Super Admins, Marketing Managers and Team Leaders</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <InlineError message={serverError} />

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                Work email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  {...register('email')}
                  placeholder="you@company.com"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#274C77] focus:bg-white text-slate-800 transition-all font-medium"
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#274C77] focus:bg-white text-slate-800 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center">
              <input id="rememberMe" type="checkbox" {...register('rememberMe')} className="w-4 h-4 text-[#274C77] border-slate-300 rounded focus:ring-[#274C77]" />
              <label htmlFor="rememberMe" className="ml-2 block text-xs text-slate-600 font-semibold">
                Keep me signed in on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-[#274C77] hover:bg-[#1B3B6F]"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
            Forgot your password? Ask your administrator to reset it.
          </p>
        </div>
      </div>
    </div>
  );
};
