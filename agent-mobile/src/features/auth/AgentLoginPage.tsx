import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { JBConXLogo } from '@shared/components/JBConXLogo';
import { fieldErrors, normalizeError } from '@shared/api/errors';
import { mobileTokenStorage } from '../../auth/tokenStorage';
import { useAppDispatch } from '../../redux/hooks';
import { API_BASE_URL } from '../../redux/services/baseApi';
import { useLoginMutation } from '../../redux/services/authApi';
import { setCredentials } from '../../redux/slices/authSlice';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your work email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const AgentLoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const result = await login(data).unwrap();
      if (result.user.role !== 'field_agent') {
        void fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${result.token}` } }).catch(() => undefined);
        setServerError('This app is for Field Agents. Managers and team leaders should use the admin web app.');
        return;
      }
      await mobileTokenStorage.set(result.token, true);
      dispatch(setCredentials({ user: result.user, token: result.token }));
    } catch (err) {
      const f = fieldErrors(err);
      if (f.email) setError('email', { message: f.email });
      const e = normalizeError(err);
      setServerError(
        e.code === 'AUTH_INVALID_CREDENTIALS'
          ? 'Incorrect email or password.'
          : e.code === 'ACCOUNT_LOCKED'
            ? 'Too many failed attempts. Please wait a few minutes and try again.'
            : e.code === 'RATE_LIMITED'
              ? 'Too many requests. Please wait a moment.'
              : e.message
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#E7ECEF] flex flex-col justify-center p-4 max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-br from-[#1B3B6F] via-[#274C77] to-[#6096BA] p-8 text-white text-center flex flex-col items-center">
          <div className="mb-2">
            <JBConXLogo size="lg" variant="light" tagline="FIELD AGENT" />
          </div>
          <p className="text-xs text-[#A3CEF1] mt-1 font-medium">Field Operations</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {serverError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">Work email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register('email')}
                placeholder="you@company.com"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77] font-medium"
              />
              {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-10 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#274C77] text-white font-bold text-xs shadow-lg hover:bg-[#1B3B6F] flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">Forgot your password? Ask your team leader or administrator.</p>
        </div>
      </div>
    </div>
  );
};
