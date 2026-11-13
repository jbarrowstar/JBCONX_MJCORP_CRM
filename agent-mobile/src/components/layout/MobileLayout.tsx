import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarCheck, 
  User, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../redux/slices/authSlice';
import { MobileThemeSelector } from '../common/MobileThemeSelector';
import { CRM_THEMES } from '@shared/constants/themes';
import { JBConXLogo } from '@shared/components/JBConXLogo';

export const MobileLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const currentTheme = useAppSelector((state) => state.ui.theme) || 'classic-blue';
  const themeConfig = CRM_THEMES[currentTheme] || CRM_THEMES['classic-blue'];

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', path: '/leads', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: Clock },
    { label: 'Visits', path: '/visits', icon: CalendarCheck },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-300" style={{ backgroundColor: themeConfig.bgCanvas }}>
      {/* Tablet & Desktop Side Drawer Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0 min-h-screen shadow-sm">
        {/* Brand Header */}
        <div className={`h-16 flex items-center px-5 border-b border-slate-100 bg-gradient-to-r ${themeConfig.headerGrad} shadow-sm`}>
          <JBConXLogo size="md" variant="light" tagline="FIELD AGENT PORTAL" />
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-xl text-white font-black flex items-center justify-center text-sm shadow-md"
              style={{ backgroundColor: themeConfig.secondary }}
            >
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.teamName || 'Northern Squad'}</p>
            </div>
          </div>
        </div>

        {/* Theme Picker in Sidebar */}
        <div className="px-4 py-2 border-b border-slate-100">
          <MobileThemeSelector />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? themeConfig.activeItemBg
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sign Out Button in Desktop/Tablet Sidebar */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => dispatch(logout())}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto w-full pb-20 md:pb-6">
        {/* Tablet / Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
            <ShieldCheck className="w-4 h-4" style={{ color: themeConfig.secondary }} />
            <span>Active Suite Theme: <strong style={{ color: themeConfig.secondary }}>{themeConfig.name}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-700 font-bold">Shift Active</span>
          </div>
        </header>

        {/* Mobile Top Header (with Official JBConX Logo) */}
        <div className="md:hidden flex items-center justify-between p-3 bg-white border-b border-slate-200">
          <JBConXLogo size="sm" variant="dark" tagline="AGENT" />
          <MobileThemeSelector />
        </div>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 z-50 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`
              }
              style={({ isActive }) => (isActive ? { color: themeConfig.secondary } : {})}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
