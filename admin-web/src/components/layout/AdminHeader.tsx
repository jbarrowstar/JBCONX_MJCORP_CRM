import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut, KeyRound, ChevronRight } from 'lucide-react';
import { ROLE_LABELS } from '@shared/auth/roles';
import { JBConXLogo } from '@shared/components/JBConXLogo';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setMobileNavOpen } from '../../redux/slices/uiSlice';
import { signOut } from '../../redux/session';
import { ChangePasswordModal } from '../../features/auth/ChangePasswordModal';
import { navItemFor } from './navigation';

export const AdminHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const current = navItemFor(pathname);
  const { user } = useAppSelector((state) => state.auth);
  const { items } = useAppSelector((state) => state.notification);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <header className="h-16 flex-shrink-0 bg-white/90 backdrop-blur border-b border-slate-200/80 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Small screens only: the desktop collapse control lives inside the sidebar */}
        <button
          type="button"
          onClick={() => dispatch(setMobileNavOpen(true))}
          className="icon-btn lg:hidden -ml-2"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <JBConXLogo size="sm" variant="dark" className="lg:hidden" />

        {current && (
          <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-[13px] min-w-0">
            <span className="text-slate-400">{current.group}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <span className="font-medium text-slate-800 truncate">{current.name}</span>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notification bell: only shown once the backend can deliver notifications */}
        {items.length > 0 && (
          <button className="icon-btn relative" aria-label="Notifications">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2.5 pl-3 pr-1">
          <div className="text-right leading-tight">
            <div className="text-[13px] font-semibold text-slate-900">{user?.name}</div>
            <div className="text-2xs text-slate-500">{user ? ROLE_LABELS[user.role] : ''}</div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <button
          onClick={() => setShowPassword(true)}
          title="Change password"
          aria-label="Change password"
          className="icon-btn"
        >
          <KeyRound className="w-[18px] h-[18px]" />
        </button>

        <button
          onClick={() => void signOut(dispatch)}
          title="Sign out"
          className="icon-btn hover:!text-rose-600 hover:!bg-rose-50"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </header>
  );
};
