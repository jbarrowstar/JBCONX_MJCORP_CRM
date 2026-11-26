import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, CalendarCheck, User, LogOut, CalendarDays } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { signOut } from '../../redux/session';
import { ToastHost } from '../common/ToastHost';
import { JBConXLogo } from '@shared/components/JBConXLogo';

const NAV_ITEMS = [
  { label: 'Home', title: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', title: 'My leads', path: '/leads', icon: Users },
  { label: 'Attendance', title: 'Attendance', path: '/attendance', icon: Clock },
  { label: 'Visits', title: 'Customer visits', path: '/visits', icon: CalendarCheck },
  { label: 'Profile', title: 'My profile', path: '/profile', icon: User },
];

const initials = (name?: string) => (name ?? '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

/**
 * Field Agent portal shell.
 * md and up: a desktop website layout (sidebar + top bar + wide content).
 * Phones: compact top bar + thumb-friendly bottom navigation (also used by the Android build).
 */
export const MobileLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const current = NAV_ITEMS.find((i) => pathname.startsWith(i.path));
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen md:h-screen md:flex md:overflow-hidden bg-canvas">
      {/* Sidebar (tablet & desktop) */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 flex-shrink-0 bg-white border-r border-slate-200/80">
        <div className="h-16 flex items-center px-5 border-b border-slate-100 flex-shrink-0">
          <JBConXLogo size="md" variant="dark" tagline="Field Agent Portal" />
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto scroll-thin px-3 py-4" aria-label="Main navigation">
          <p className="px-3 mb-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-slate-400">Workspace</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-600" aria-hidden />}
                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span>{item.title}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <span className="avatar w-9 h-9 text-xs">{initials(user?.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-2xs text-slate-500 truncate">{user?.team?.name ?? 'No team yet'}</p>
            </div>
            <button onClick={() => void signOut(dispatch)} className="icon-btn w-8 h-8 hover:!text-rose-600 hover:!bg-rose-50" aria-label="Sign Out" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden">
        {/* Top bar (tablet & desktop) */}
        <header className="hidden md:flex items-center justify-between gap-4 h-16 px-6 lg:px-8 bg-white/90 backdrop-blur border-b border-slate-200/80 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[13px] min-w-0">
            <span className="text-slate-400">Field Agent Portal</span>
            {current && (
              <>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-800 truncate">{current.title}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="hidden lg:inline-flex items-center gap-1.5 text-slate-500">
              <CalendarDays className="w-4 h-4 text-slate-400" /> {today}
            </span>
            {user?.employeeCode && <span className="badge bg-slate-50 text-slate-600 border-slate-200 font-mono">{user.employeeCode}</span>}
          </div>
        </header>

        {/* Top bar (phones) */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/95 backdrop-blur border-b border-slate-200/80">
          <JBConXLogo size="sm" variant="dark" tagline="Field Agent" />
          <span className="avatar w-8 h-8 text-2xs" aria-hidden>{initials(user?.name)}</span>
        </header>

        <main className="flex-1 md:min-h-0 md:overflow-y-auto scroll-thin px-4 pt-5 pb-24 sm:px-6 md:pb-8 lg:px-8 lg:pt-7">
          <div className="w-full max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom navigation (phones) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-stretch justify-around"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${isActive ? 'bg-brand-50' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <ToastHost />
    </div>
  );
};
