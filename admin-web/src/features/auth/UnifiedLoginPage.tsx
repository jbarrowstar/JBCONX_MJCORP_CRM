import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAppDispatch } from '../../redux/hooks';
import { setCredentials } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { JBConXLogo } from '@shared/components/JBConXLogo';
import { UserRole } from '@shared/types';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Please enter your email or Agent ID'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const UnifiedLoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: 'admin@jbconx.com',
      password: 'password123',
      rememberMe: true,
    },
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setValue('identifier', 'admin@jbconx.com');
    } else {
      setValue('identifier', 'agent.miller@jbconx.com');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (selectedRole === 'ADMIN') {
        dispatch(
          setCredentials({
            user: {
              id: 'usr_admin_01',
              name: 'Alexander Wright',
              email: data.identifier,
              role: 'ADMIN',
              createdAt: new Date().toISOString(),
            },
            token: 'mock-jwt-admin-token-xyz',
          })
        );
        navigate('/admin/dashboard');
      } else {
        dispatch(
          setCredentials({
            user: {
              id: 'usr_agent_01',
              name: 'David Miller',
              email: data.identifier,
              role: 'AGENT',
              teamName: 'Northern Squad',
              createdAt: new Date().toISOString(),
            },
            token: 'mock-jwt-agent-token-xyz',
          })
        );
        navigate('/agent/dashboard');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1E36] via-[#1B3B6F] to-[#274C77] flex flex-col justify-center items-center p-4 selection:bg-[#6096BA] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        {/* Brand Header */}
        <div className="bg-[#274C77] p-8 text-center text-white relative flex flex-col items-center justify-center">
          <div className="mb-2">
            <JBConXLogo size="lg" variant="light" />
          </div>
          <p className="text-white/80 text-xs mt-1 font-medium tracking-wide">
            Commercial Marketing & CRM Intelligence
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Sign In to Your Workspace</h2>
            <p className="text-xs text-slate-500 mt-1">Select your account role to continue</p>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-[#274C77] shadow-md border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('AGENT')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                selectedRole === 'AGENT'
                  ? 'bg-white text-[#047857] shadow-md border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Field Agent</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {selectedRole === 'ADMIN' ? 'Business Email' : 'Agent Email / ID'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('identifier')}
                  placeholder={selectedRole === 'ADMIN' ? 'admin@jbconx.com' : 'agent.miller@jbconx.com'}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#274C77] focus:bg-white text-slate-800 transition-all font-medium"
                />
              </div>
              {errors.identifier && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <a href="#forgot" className="text-[11px] text-[#274C77] hover:underline font-bold">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#274C77] focus:bg-white text-slate-800 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 text-[#274C77] border-slate-300 rounded focus:ring-[#274C77]"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-xs text-slate-600 font-semibold">
                Remember this session on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                selectedRole === 'ADMIN'
                  ? 'bg-[#274C77] hover:bg-[#1B3B6F]'
                  : 'bg-[#047857] hover:bg-[#065F46]'
              }`}
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as {selectedRole === 'ADMIN' ? 'Admin' : 'Field Agent'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              JBConX CRM Platform • Single Unified Web Application
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

