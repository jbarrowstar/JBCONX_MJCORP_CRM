import React from 'react';
import { Phone, Mail, ShieldCheck, Target, LogOut, Users } from 'lucide-react';
import { ROLE_LABELS } from '@shared/auth/roles';
import { formatDate } from '@shared/utils';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { signOut } from '../../redux/session';

export const AgentProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  if (!user) return null;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My profile</h1>
        <p className="text-xs text-slate-500">Your account details</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#A3CEF1] text-[#274C77] font-bold text-xl flex items-center justify-center mx-auto shadow-inner">
          {user.name[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
          {user.employeeCode && (
            <span className="text-[10px] font-mono bg-blue-50 text-[#274C77] px-2.5 py-0.5 rounded-full font-bold">{user.employeeCode}</span>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 text-left text-xs space-y-2 text-slate-600">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /><span>{user.email}</span></div>
          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><span>{user.phone || 'No phone on file'}</span></div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /><span>{user.team?.name ?? 'No team yet'}</span></div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-slate-400" /><span>{ROLE_LABELS[user.role]}</span></div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-400" />
            <span>{user.targetLeadsMonthly != null ? `Monthly target: ${user.targetLeadsMonthly} leads` : 'No monthly target set'}</span>
          </div>
          {user.joiningDate && <p className="text-[11px] text-slate-400 pt-1">Joined {formatDate(user.joiningDate)}</p>}
        </div>
      </div>

      <button
        onClick={() => void signOut(dispatch)}
        className="w-full py-3 rounded-2xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
};
