import React from 'react';
import { Phone, Mail, ShieldCheck, Target, LogOut, Users, CalendarDays, BadgeCheck } from 'lucide-react';
import { ROLE_LABELS } from '@shared/auth/roles';
import { formatDate } from '@shared/utils';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { signOut } from '../../redux/session';

const Row: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode }> = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-4 px-5 py-4">
    <span className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-500" />
    </span>
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-[13px] sm:text-sm font-medium text-slate-900 mt-0.5 break-words">{children}</p>
    </div>
  </div>
);

export const AgentProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  if (!user) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My profile</h1>
          <p className="page-subtitle">Your account details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Identity */}
        <section className="card overflow-hidden">
          <div className="h-20 bg-brand-950 bg-[radial-gradient(ellipse_at_top_left,rgba(44,116,184,0.45),transparent_60%)]" aria-hidden />
          <div className="px-6 pb-6 -mt-9 text-center">
            <div className="w-[72px] h-[72px] rounded-full bg-white p-1 mx-auto shadow-card">
              <div className="avatar w-full h-full text-xl">{user.name[0]?.toUpperCase()}</div>
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-slate-900">{user.name}</h2>
            <p className="text-[13px] text-slate-500">{ROLE_LABELS[user.role]}</p>
            {user.employeeCode && (
              <span className="mt-2 inline-flex badge bg-brand-50 text-brand-700 border-brand-200 font-mono">{user.employeeCode}</span>
            )}
            <button onClick={() => void signOut(dispatch)} className="btn btn-secondary w-full mt-6 !text-rose-600 hover:!bg-rose-50 hover:!border-rose-200">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </section>

        {/* Details */}
        <section className="card lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="card-title">Account details</h2>
            <p className="card-subtitle">Managed by your administrator. Ask them if anything needs to change.</p>
          </div>
          <div className="divide-y divide-slate-100 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:[&>*]:border-b sm:[&>*]:border-slate-100 sm:[&>*:nth-child(odd)]:border-r">
            <Row icon={Mail} label="Work email">{user.email}</Row>
            <Row icon={Phone} label="Phone">{user.phone || 'No phone on file'}</Row>
            <Row icon={Users} label="Team">{user.team?.name ?? 'No team yet'}</Row>
            <Row icon={ShieldCheck} label="Role">{ROLE_LABELS[user.role]}</Row>
            <Row icon={Target} label="Monthly target">
              {user.targetLeadsMonthly != null ? `Monthly target: ${user.targetLeadsMonthly} leads` : 'No monthly target set'}
            </Row>
            <Row icon={user.joiningDate ? CalendarDays : BadgeCheck} label={user.joiningDate ? 'Joined' : 'Status'}>
              {user.joiningDate ? `Joined ${formatDate(user.joiningDate)}` : user.isActive ? 'Active account' : 'Inactive account'}
            </Row>
          </div>
        </section>
      </div>
    </div>
  );
};
