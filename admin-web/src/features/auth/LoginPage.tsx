import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Users, MapPinned, BarChart3 } from 'lucide-react';
import { JBConXLogo } from '@shared/components/JBConXLogo';
import { fieldErrors, normalizeError } from '@shared/api/errors';
import { isAdminWebRole } from '@shared/auth/roles';
import { webTokenStorage } from '@shared/auth/tokenStorage';
import { useAppDispatch } from '../../redux/hooks';
import { API_BASE_URL } from '../../redux/services/baseApi';
import { useLoginMutation } from '../../redux/services/authApi';
import { setCredentials } from '../../redux/slices/authSlice';
import { InlineError } from '../../components/common/States';
import { MOCK_API_ENABLED } from '@shared/mock/mockMode';
import { MockCredentialsHint } from '@shared/mock/MockCredentialsHint';

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
    setValue,
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
        if (!(import.meta.env.DEV && MOCK_API_ENABLED)) void fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${result.token}` } }).catch(() => undefined);
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
    <div className="min-h-screen flex bg-white">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between overflow-hidden bg-brand-950 text-white px-12 py-10 xl:px-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(44,116,184,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(96,150,186,0.18),transparent_50%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

        <div className="relative">
          <JBConXLogo layout="stacked" variant="light" size="lg" />
        </div>

        <div className="relative max-w-md">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand-300">Marketing &amp; Field Sales CRM</p>
          <h2 className="mt-3 font-display text-[34px] leading-[1.15] font-bold tracking-tight text-white">
            One workspace for your leads, teams and field force.
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Users, title: 'Lead pipeline', text: 'Capture, assign and follow every lead through to conversion.' },
              { icon: MapPinned, title: 'Field operations', text: 'Attendance, customer visits and follow-ups from the field.' },
              { icon: BarChart3, title: 'Performance insight', text: 'Team and agent reports for confident decisions.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 w-9 h-9 rounded-lg bg-white/[0.08] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-[18px] h-[18px] text-brand-300" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="block text-[13px] text-slate-300/90 mt-0.5">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} JBCONX · Admin workspace</p>
      </aside>

      {/* Sign-in form */}
      <main className="flex-1 flex flex-col min-h-screen bg-canvas lg:bg-white">
        <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden flex justify-center mb-8">
              <JBConXLogo layout="stacked" variant="dark" size="sm" />
            </div>

            <div className="bg-white lg:bg-transparent rounded-xl border border-slate-200/80 lg:border-0 shadow-card lg:shadow-none p-6 sm:p-8 lg:p-0">
              <div className="mb-7">
                <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.1em] text-brand-600">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin portal
                </span>
                <h1 className="mt-2 font-display text-[26px] leading-8 font-bold tracking-tight text-slate-900">Sign in to your workspace</h1>
                <p className="text-[13px] text-slate-500 mt-1.5">Super Admins, Marketing Managers and Team Leaders</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <InlineError message={serverError} />

                <div>
                  <label htmlFor="email" className="label">
                    Work email
                  </label>
                  <div className="relative">
                    <Mail className="control-icon" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      {...register('email')}
                      placeholder="you@company.com"
                      aria-invalid={!!errors.email}
                      className={`control w-full h-11 pl-10 text-sm ${errors.email ? '!border-rose-400' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-600 mt-1.5">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="control-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      {...register('password')}
                      placeholder="••••••••"
                      aria-invalid={!!errors.password}
                      className={`control w-full h-11 pl-10 pr-11 text-sm ${errors.password ? '!border-rose-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 icon-btn w-8 h-8"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-600 mt-1.5">{errors.password.message}</p>}
                </div>

                <div className="flex items-center">
                  <input id="rememberMe" type="checkbox" {...register('rememberMe')} className="checkbox" />
                  <label htmlFor="rememberMe" className="ml-2 block text-[13px] text-slate-600">
                    Keep me signed in on this device
                  </label>
                </div>

                <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">
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

              <p className="mt-7 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
                Forgot your password? Ask your administrator to reset it.
              </p>
              {import.meta.env.DEV && MOCK_API_ENABLED && (
                <MockCredentialsHint app="admin" onPick={(email, password) => { setValue('email', email); setValue('password', password); }} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
