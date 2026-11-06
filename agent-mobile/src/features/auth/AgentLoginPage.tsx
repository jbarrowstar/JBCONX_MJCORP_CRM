import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { useAppDispatch } from '../../redux/hooks';
import { setCredentials } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { JBConXLogo } from '@shared/components/JBConXLogo';

const agentLoginSchema = z.object({
  identifier: z.string().min(3, 'Enter your Agent ID or Email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AgentLoginForm = z.infer<typeof agentLoginSchema>;

export const AgentLoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgentLoginForm>({
    resolver: zodResolver(agentLoginSchema),
    defaultValues: {
      identifier: 'AGT-101',
      password: 'password123',
    },
  });

  const onSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      dispatch(
        setCredentials({
          user: {
            id: 'usr_mock_agent_1',
            name: 'David Miller',
            email: 'david.miller@jbconx.com',
            role: 'FIELD_AGENT',
            teamName: 'Northern Squad',
            createdAt: new Date().toISOString(),
          },
          token: 'mock-agent-jwt',
        })
      );
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#E7ECEF] flex flex-col justify-center p-4 max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Top Banner with JBConX Logo */}
        <div className="bg-gradient-to-br from-[#1B3B6F] via-[#274C77] to-[#6096BA] p-8 text-white text-center flex flex-col items-center">
          <div className="mb-2">
            <JBConXLogo size="lg" variant="light" tagline="FIELD AGENT REP" />
          </div>
          <p className="text-xs text-[#A3CEF1] mt-1 font-medium">Field Operations & Geotagged Shifts</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Agent ID / Work Email</label>
              <input
                type="text"
                {...register('identifier')}
                placeholder="e.g. AGT-101 or email"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77] font-medium"
              />
              {errors.identifier && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-10 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#274C77] text-white font-bold text-xs shadow-lg hover:bg-[#1B3B6F] flex items-center justify-center gap-2 mt-4 transition-all"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Field Representative</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
            Authorized Personnel Only • GPS Verified Shifts
          </p>
        </div>
      </div>
    </div>
  );
};
